import React, { useCallback, useRef, useState } from 'react'
import { useParameter, useStorybookState } from 'storybook/manager-api'
import { Button, Placeholder } from 'storybook/internal/components'
import { styled } from 'storybook/theming'

import { PARAM_KEY } from '../constants'
import { getLibrary } from '../library'
import { generateFlow } from '../api'
import { exportFlowAsZip } from '../export'
import type {
  ComponentLibrary,
  FlowPlan,
  FlowStep,
  GeneratingPhase,
  PanelError,
  PanelState
} from '../types'

/* ── Persistent cache (survives tab navigation) ── */

interface FlowCache {
  state: PanelState
  brief: string
  plan: FlowPlan | null
  currentStep: number
  library: ComponentLibrary | null
  error: PanelError | null
  saveStatus: { success: boolean; message: string } | null
}

const cache: FlowCache = {
  state: 'idle',
  brief: '',
  plan: null,
  currentStep: 0,
  library: null,
  error: null,
  saveStatus: null
}

/* ── Layout ── */

const Container = styled.div({
  display: 'flex',
  height: '100%',
  overflow: 'hidden'
})

const Sidebar = styled.div(({ theme }) => ({
  width: 320,
  minWidth: 320,
  borderRight: `1px solid ${theme.appBorderColor}`,
  overflowY: 'auto',
  padding: 16,
  fontFamily: theme.typography.fonts.base,
  fontSize: 13,
  boxSizing: 'border-box'
}))

const PreviewArea = styled.div(({ theme }) => ({
  flex: 1,
  position: 'relative',
  background: theme.background.content
}))

const StoryIframe = styled.iframe({
  width: '100%',
  height: '100%',
  border: 'none'
})

const PreviewPlaceholder = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: theme.color.mediumdark,
  fontSize: 14,
  fontFamily: theme.typography.fonts.base,
  textAlign: 'center' as const,
  padding: 40,
  lineHeight: 1.6
}))

const ProgressBar = styled.div({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  display: 'flex',
  gap: 2,
  padding: '4px 8px',
  zIndex: 1,
  pointerEvents: 'none'
})

const ProgressDot = styled.div<{ $state: 'done' | 'current' | 'upcoming' }>(
  ({ theme, $state }) => ({
    flex: 1,
    height: 3,
    borderRadius: 2,
    background:
      $state === 'done'
        ? theme.color.positive
        : $state === 'current'
          ? theme.color.secondary
          : theme.appBorderColor,
    transition: 'background 0.2s ease'
  })
)

/* ── Missing component preview ── */

const MissingOverlay = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  background: theme.background.content
}))

const MissingCard = styled.div(({ theme }) => ({
  textAlign: 'center' as const,
  padding: '40px 48px',
  border: `2px dashed ${theme.appBorderColor}`,
  borderRadius: 12,
  maxWidth: 480
}))

const MissingBadge = styled.div(({ theme }) => ({
  display: 'inline-block',
  padding: '3px 10px',
  borderRadius: 4,
  fontSize: 11,
  fontWeight: 700,
  background: theme.color.warning,
  color: '#fff',
  marginBottom: 12,
  letterSpacing: '0.5px'
}))

const MissingTitle = styled.h2(({ theme }) => ({
  margin: '0 0 8px',
  fontSize: 18,
  color: theme.color.defaultText
}))

const MissingDescription = styled.p(({ theme }) => ({
  margin: '0 0 20px',
  fontSize: 13,
  color: theme.color.mediumdark,
  lineHeight: 1.5
}))

const ComponentSpec = styled.div(({ theme }) => ({
  textAlign: 'left' as const,
  padding: 16,
  borderRadius: 8,
  background: theme.background.hoverable,
  border: `1px solid ${theme.appBorderColor}`
}))

const SpecLabel = styled.div(({ theme }) => ({
  fontSize: 10,
  fontWeight: 700,
  color: theme.color.mediumdark,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  marginBottom: 4
}))

const SpecComponentName = styled.code(({ theme }) => ({
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  color: theme.color.secondary,
  fontFamily: theme.typography.fonts.mono,
  marginBottom: 12
}))

const PropsList = styled.div(({ theme }) => ({
  fontSize: 12,
  fontFamily: theme.typography.fonts.mono,
  color: theme.color.defaultText,
  lineHeight: 1.8
}))

const PropName = styled.span(({ theme }) => ({
  color: theme.color.secondary
}))

/* ── Sidebar elements ── */

const Textarea = styled.textarea(({ theme }) => ({
  width: '100%',
  minHeight: 100,
  padding: 8,
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: 4,
  fontFamily: theme.typography.fonts.base,
  fontSize: 13,
  resize: 'vertical',
  background: theme.input.background,
  color: theme.input.color,
  boxSizing: 'border-box'
}))

const LibraryStatus = styled.div<{ $source: string }>(({ theme, $source }) => ({
  fontSize: 11,
  color: $source === 'designsync' ? theme.color.positive : theme.color.mediumdark,
  marginBottom: 8
}))

const PhaseList = styled.ul({
  listStyle: 'none',
  padding: 0,
  margin: '16px 0'
})

const PhaseItem = styled.li<{ $active: boolean; $done: boolean }>(({ theme, $active, $done }) => ({
  padding: '4px 0',
  color: $done ? theme.color.positive : $active ? theme.color.secondary : theme.color.mediumdark,
  fontWeight: $active ? 600 : 400
}))

const SidebarHeader = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8
})

const FlowTitle = styled.h2(({ theme }) => ({
  margin: 0,
  fontSize: 15,
  fontWeight: 600,
  color: theme.color.defaultText
}))

const Separator = styled.hr(({ theme }) => ({
  border: 'none',
  borderTop: `1px solid ${theme.appBorderColor}`,
  margin: '8px 0 12px'
}))

const StepNav = styled.div({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  marginBottom: 12
})

const StepCounter = styled.span(({ theme }) => ({
  fontSize: 12,
  color: theme.color.mediumdark
}))

const StepTitle = styled.h3(({ theme }) => ({
  margin: '0 0 4px',
  fontSize: 14,
  color: theme.color.defaultText
}))

const ComponentName = styled.span(({ theme }) => ({
  fontSize: 12,
  color: theme.color.mediumdark
}))

const GapBadge = styled.span(({ theme }) => ({
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 700,
  background: theme.color.warning,
  color: '#fff',
  marginLeft: 8
}))

const ApiBadge = styled.span(({ theme }) => ({
  display: 'inline-block',
  padding: '2px 6px',
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 700,
  background: theme.color.secondary,
  color: '#fff',
  marginLeft: 8
}))

const Rationale = styled.blockquote(({ theme }) => ({
  margin: '12px 0',
  padding: '8px 12px',
  borderLeft: `3px solid ${theme.color.secondary}`,
  background: theme.background.hoverable,
  fontSize: 12,
  lineHeight: 1.5
}))

const InteractionHint = styled.div(({ theme }) => ({
  fontSize: 11,
  color: theme.color.mediumdark,
  fontStyle: 'italic',
  marginTop: 8
}))

const ErrorBox = styled.div(({ theme }) => ({
  padding: 12,
  borderRadius: 4,
  background: theme.background.negative,
  color: theme.color.negativeText,
  fontSize: 12
}))

const ButtonRow = styled.div({
  display: 'flex',
  gap: 8,
  marginTop: 12
})

const SaveStatus = styled.div<{ $success: boolean }>(({ theme, $success }) => ({
  fontSize: 11,
  marginTop: 8,
  color: $success ? theme.color.positive : theme.color.negativeText
}))

const GapSummary = styled.div(({ theme }) => ({
  marginTop: 12,
  padding: 10,
  borderRadius: 6,
  background: theme.background.hoverable,
  border: `1px solid ${theme.appBorderColor}`,
  fontSize: 11
}))

const GapSummaryTitle = styled.div(({ theme }) => ({
  fontWeight: 700,
  color: theme.color.warning,
  marginBottom: 6,
  fontSize: 11
}))

const GapSummaryItem = styled.div(({ theme }) => ({
  color: theme.color.defaultText,
  padding: '2px 0',
  fontFamily: theme.typography.fonts.mono,
  fontSize: 11
}))

const PHASES: { key: GeneratingPhase; label: string }[] = [
  { key: 'analysing-library', label: 'Analysing component library...' },
  { key: 'decomposing-flow', label: 'Decomposing flow into steps...' },
  { key: 'applying-ux-principles', label: 'Applying UX principles...' }
]

export const FlowTab: React.FC = () => {
  const storyState = useStorybookState()
  const config = useParameter<{ apiKey?: string }>(PARAM_KEY)

  const storyIndex = storyState.internal_index?.entries ?? {}

  // Initialize from cache
  const [state, _setState] = useState<PanelState>(cache.state)
  const [brief, _setBrief] = useState(cache.brief)
  const [phase, setPhase] = useState<GeneratingPhase>('analysing-library')
  const [plan, _setPlan] = useState<FlowPlan | null>(cache.plan)
  const [currentStep, _setCurrentStep] = useState(cache.currentStep)
  const [error, _setError] = useState<PanelError | null>(cache.error)
  const [library, _setLibrary] = useState<ComponentLibrary>(
    () => cache.library ?? getLibrary(storyIndex)
  )
  const [saveStatus, _setSaveStatus] = useState<{ success: boolean; message: string } | null>(
    cache.saveStatus
  )

  // Wrapped setters that also update the cache
  const setState = useCallback((v: PanelState) => {
    cache.state = v
    _setState(v)
  }, [])
  const setBrief = useCallback((v: string) => {
    cache.brief = v
    _setBrief(v)
  }, [])
  const setPlan = useCallback((v: FlowPlan | null) => {
    cache.plan = v
    _setPlan(v)
  }, [])
  const setCurrentStep = useCallback((v: number) => {
    cache.currentStep = v
    _setCurrentStep(v)
  }, [])
  const setError = useCallback((v: PanelError | null) => {
    cache.error = v
    _setError(v)
  }, [])
  const setLibrary = useCallback((v: ComponentLibrary) => {
    cache.library = v
    _setLibrary(v)
  }, [])
  const setSaveStatus = useCallback((v: { success: boolean; message: string } | null) => {
    cache.saveStatus = v
    _setSaveStatus(v)
  }, [])

  const phaseTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearPhaseTimers = useCallback(() => {
    phaseTimers.current.forEach(clearTimeout)
    phaseTimers.current = []
  }, [])

  const goToStep = useCallback(
    (index: number) => {
      if (!plan) return
      if (!plan.steps[index]) return
      setCurrentStep(index)
    },
    [plan, setCurrentStep]
  )

  const handleGenerate = useCallback(async () => {
    const apiKey = config?.apiKey
    if (!apiKey) {
      setError({
        type: 'no-api-key',
        message: 'Add an API key to .storybook/preview.ts via parameters.flowbuilder.apiKey'
      })
      setState('error')
      return
    }

    const lib = getLibrary(storyIndex)
    setLibrary(lib)
    if (lib.components.length === 0) {
      setError({
        type: 'empty-library',
        message: 'No components found. Add stories to your Storybook or connect DesignSync.'
      })
      setState('error')
      return
    }

    setState('generating')
    setPhase('analysing-library')
    clearPhaseTimers()

    phaseTimers.current.push(setTimeout(() => setPhase('decomposing-flow'), 2000))
    phaseTimers.current.push(setTimeout(() => setPhase('applying-ux-principles'), 5000))

    try {
      const storyIds = new Set(Object.keys(storyIndex))
      const result = await generateFlow({ apiKey, brief, library: lib, storyIds })
      clearPhaseTimers()
      setPlan(result)
      setCurrentStep(0)
      setState('viewing')
      setSaveStatus(null)
    } catch (err) {
      clearPhaseTimers()
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('timeout') || message.includes('Timeout')) {
        setError({ type: 'timeout', message: 'Request timed out. Try a shorter flow description.' })
      } else if (
        message.includes('parse') ||
        message.includes('Parse') ||
        message.includes('JSON')
      ) {
        setError({ type: 'parse-error', message: `Failed to parse Claude's response: ${message}` })
      } else {
        setError({ type: 'api-error', message })
      }
      setState('error')
    }
  }, [
    storyIndex,
    brief,
    config,
    clearPhaseTimers,
    setState,
    setError,
    setLibrary,
    setPlan,
    setCurrentStep,
    setSaveStatus
  ])

  const handleReset = useCallback(() => {
    setState('idle')
    setPlan(null)
    setCurrentStep(0)
    setSaveStatus(null)
    setBrief('')
  }, [setState, setPlan, setCurrentStep, setSaveStatus, setBrief])

  const handleExport = useCallback(async () => {
    if (plan) await exportFlowAsZip(plan, library)
  }, [plan, library])

  const handleSave = useCallback(async () => {
    if (!plan) return
    setSaveStatus(null)
    try {
      const response = await fetch('/__flowbuilder/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, library })
      })
      const result = await response.json()
      if (result.success) {
        setSaveStatus({ success: true, message: `Saved ${result.files.length} files to project` })
      } else {
        setSaveStatus({ success: false, message: result.error ?? 'Save failed' })
      }
    } catch (err) {
      setSaveStatus({ success: false, message: err instanceof Error ? err.message : 'Save failed' })
    }
  }, [plan, library, setSaveStatus])

  const step: FlowStep | undefined = plan?.steps[currentStep]

  const iframeSrc =
    step?.status === 'exists' && step.storyId
      ? `/iframe.html?id=${encodeURIComponent(step.storyId)}&viewMode=story`
      : null

  // Gather all missing steps for the gap summary
  const missingSteps = plan?.steps.filter((s) => s.status === 'missing') ?? []

  return (
    <Container>
      <Sidebar>
        {state === 'idle' && (
          <>
            {(() => {
              const lib = getLibrary(storyIndex)
              return (
                <LibraryStatus $source={lib.source}>
                  {lib.source === 'designsync'
                    ? `DesignSync library (${lib.components.length} components)`
                    : `Auto-discovered ${lib.components.length} components from stories`}
                </LibraryStatus>
              )
            })()}
            <Textarea
              placeholder="Describe the user flow you want to build, e.g. 'User signs up, completes onboarding, and sees their dashboard for the first time'"
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
            />
            <ButtonRow>
              <Button
                variant="solid"
                size="medium"
                disabled={!brief.trim()}
                onClick={handleGenerate}
              >
                Generate Flow
              </Button>
            </ButtonRow>
          </>
        )}

        {state === 'generating' && (
          <PhaseList>
            {PHASES.map(({ key, label }, i) => {
              const currentIndex = PHASES.findIndex((p) => p.key === phase)
              return (
                <PhaseItem key={key} $active={i === currentIndex} $done={i < currentIndex}>
                  {i < currentIndex ? '\u2713' : i === currentIndex ? '\u25CB' : '\u00B7'} {label}
                </PhaseItem>
              )
            })}
          </PhaseList>
        )}

        {state === 'viewing' && plan && step && (
          <>
            <SidebarHeader>
              <FlowTitle>{plan.flowName}</FlowTitle>
              <Button size="small" onClick={handleReset}>
                Reset
              </Button>
            </SidebarHeader>
            <Separator />

            <StepNav>
              <Button
                size="small"
                disabled={currentStep === 0}
                onClick={() => goToStep(currentStep - 1)}
              >
                Prev
              </Button>
              <StepCounter>
                Step {currentStep + 1} of {plan.steps.length}
              </StepCounter>
              <Button
                size="small"
                disabled={currentStep === plan.steps.length - 1}
                onClick={() => goToStep(currentStep + 1)}
              >
                Next
              </Button>
            </StepNav>

            <StepTitle>{step.title}</StepTitle>
            <ComponentName>
              {step.componentName}
              {step.storyVariant && ` / ${step.storyVariant}`}
              {step.status === 'missing' && <GapBadge>GAP</GapBadge>}
              {step.api.hasApiCall && <ApiBadge>API</ApiBadge>}
            </ComponentName>

            <Rationale>{step.rationale}</Rationale>

            {step.interaction && <InteractionHint>Next: {step.interaction}</InteractionHint>}

            {step.status === 'missing' && step.description && (
              <Placeholder>
                <p>{step.description}</p>
              </Placeholder>
            )}

            {missingSteps.length > 0 && (
              <GapSummary>
                <GapSummaryTitle>
                  {missingSteps.length} component{missingSteps.length > 1 ? 's' : ''} to create
                </GapSummaryTitle>
                {missingSteps.map((s, i) => (
                  <GapSummaryItem key={i}>
                    {s.suggestedComponentName ?? s.componentName}
                  </GapSummaryItem>
                ))}
              </GapSummary>
            )}

            <Separator />

            <ButtonRow>
              <Button variant="solid" size="small" onClick={handleSave}>
                Save to Project
              </Button>
              <Button size="small" onClick={handleExport}>
                Download Zip
              </Button>
            </ButtonRow>
            {saveStatus && (
              <SaveStatus $success={saveStatus.success}>{saveStatus.message}</SaveStatus>
            )}
          </>
        )}

        {state === 'error' && error && (
          <>
            <ErrorBox>{error.message}</ErrorBox>
            <ButtonRow>
              <Button size="small" onClick={() => setState('idle')}>
                Back
              </Button>
            </ButtonRow>
          </>
        )}
      </Sidebar>

      <PreviewArea>
        {state === 'viewing' && plan && step && (
          <ProgressBar>
            {plan.steps.map((_, i) => (
              <ProgressDot
                key={i}
                $state={i < currentStep ? 'done' : i === currentStep ? 'current' : 'upcoming'}
              />
            ))}
          </ProgressBar>
        )}

        {state === 'idle' && (
          <PreviewPlaceholder>
            Describe a user flow and click Generate to see your components come to life.
          </PreviewPlaceholder>
        )}

        {state === 'generating' && <PreviewPlaceholder>Generating your flow...</PreviewPlaceholder>}

        {state === 'viewing' && step && iframeSrc && (
          <StoryIframe key={step.storyId} src={iframeSrc} title={step.title} />
        )}

        {state === 'viewing' && step && step.status === 'missing' && (
          <MissingOverlay>
            <MissingCard>
              <MissingBadge>COMPONENT NEEDED</MissingBadge>
              <MissingTitle>{step.title}</MissingTitle>
              <MissingDescription>
                {step.description ?? 'This component needs to be created'}
              </MissingDescription>
              <ComponentSpec>
                <SpecLabel>Suggested component</SpecLabel>
                <SpecComponentName>
                  {'<'}
                  {step.suggestedComponentName ?? step.componentName}
                  {' />'}
                </SpecComponentName>
                {step.suggestedProps && step.suggestedProps.length > 0 && (
                  <>
                    <SpecLabel>Props</SpecLabel>
                    <PropsList>
                      {step.suggestedProps.map((prop, i) => (
                        <div key={i}>
                          <PropName>{prop}</PropName>
                        </div>
                      ))}
                    </PropsList>
                  </>
                )}
              </ComponentSpec>
            </MissingCard>
          </MissingOverlay>
        )}

        {state === 'error' && (
          <PreviewPlaceholder>
            Something went wrong. Check the sidebar for details.
          </PreviewPlaceholder>
        )}
      </PreviewArea>
    </Container>
  )
}
