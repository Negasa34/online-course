import { useCallback, useEffect, useState } from 'react'
import { Atom, Bookmark, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight, Circle, Clock3, Code, Database, FileCode, GraduationCap, Menu, Palette, PanelLeftClose, PanelLeftOpen, Server, X } from 'lucide-react'
import { apiRequest } from './api'
import './LearningPaths.css'

const ROOT = '/learning-paths'
const PLANNED_PYTHON_TRACKS = [
  'Python Web Development',
  'Python Data Science',
  'Python Machine Learning',
  'Python AI and Deep Learning',
  'Python Automation and Software Development',
]
const EXAMPLE_HTML = '<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>My first page</title>\n</head>\n<body>\n  <main>\n    <h1>Hello, HTML!</h1>\n    <p>I am learning to build web pages.</p>\n  </main>\n</body>\n</html>'
const PREVIEW_CSP = "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; form-action 'none'; base-uri 'none'"

function routeFromHash() {
  const parts = window.location.hash.slice(1).split('?')[0].split('/').filter(Boolean)
  if (parts[0] !== 'learning-paths') return { page: 'paths' }
  if (parts.length === 1) return { page: 'paths' }
  if (parts[1] === 'progress') return { page: 'progress' }
  if (parts[1] === 'bookmarks') return { page: 'bookmarks' }
  if (parts[1] === 'modules' && parts[2]) return { page: 'module', id: decodeURIComponent(parts[2]) }
  if (parts[1] === 'lessons' && parts[2]) return { page: 'lesson', id: decodeURIComponent(parts[2]) }
  if (parts[1] === 'quizzes' && parts[2]) return { page: 'quiz', id: decodeURIComponent(parts[2]) }
  if (parts.length === 3 && parts[2] === 'projects') return { page: 'projects', slug: decodeURIComponent(parts[1]) }
  if (parts.length === 3 && parts[2] === 'assessment') return { page: 'final-assessment', slug: decodeURIComponent(parts[1]) }
  return { page: 'overview', slug: decodeURIComponent(parts[1]) }
}

function LearningLink({ href, children, className = '', ...props }) {
  return <a className={className} href={`#${href}`} {...props}>{children}</a>
}

function LearningPathThumbnail({ path }) {
  const pathName = `${path.title || ''} ${path.slug || ''}`.toLowerCase()
  const category = /python/.test(pathName) ? 'python'
    : /react/.test(pathName) ? 'react'
    : /javascript|\bjs\b/.test(pathName) ? 'javascript'
      : /node(?:\.js)?/.test(pathName) ? 'node'
        : /mongo(?:db)?/.test(pathName) ? 'mongodb'
          : /css/.test(pathName) ? 'css'
            : /html/.test(pathName) ? 'html'
              : 'general'
  const PathIcon = {
    html: Code,
    python: Code,
    css: Palette,
    javascript: FileCode,
    react: Atom,
    node: Server,
    mongodb: Database,
    general: BookOpen,
  }[category]

  return <span className={`learning-path-thumbnail is-${category}`} aria-hidden="true"><PathIcon size={30} strokeWidth={1.8} /></span>
}

function PythonPractice({ exercise, token, user }) {
  const [solution, setSolution] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function revealSolution() {
    setLoading(true)
    setError('')
    try {
      const result = await apiRequest(`/learning/exercises/${encodeURIComponent(exercise.id)}/reference-solution`, {
        token,
        method: 'POST',
        body: JSON.stringify({ confirmSelfCheck: true }),
      })
      setSolution(result.data)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="lesson-python-practice">
      <div className="lesson-section-heading"><div><p>LOCAL PYTHON 3.11+</p><h2>{exercise.title}</h2></div></div>
      <p>{exercise.instructions}</p>
      <p className="lesson-python-notice">Write and run this code on your computer. LearnHub does not execute, submit, or verify Python code.</p>
      <pre className="lesson-code"><code>{exercise.starterCode}</code></pre>
      <details className="lesson-python-hints"><summary>Hints</summary><ul>{exercise.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul></details>
      <fieldset className="lesson-python-checklist">
        <legend>Local self-check (not saved or graded)</legend>
        {exercise.selfChecks.map((check) => <label key={check}><input type="checkbox" />{check}</label>)}
      </fieldset>
      {!user && <p className="lesson-python-signin"><a href="#/login">Sign in as a student</a> to reveal the reference solution after your local attempt.</p>}
      <button className="button button-outline button-small" type="button" disabled={loading || !token || user?.role !== 'STUDENT'} onClick={revealSolution}>
        {loading ? 'Loading solution…' : solution ? 'Refresh reference solution' : 'Show reference solution'}
      </button>
      {error && <p className="learning-error" role="alert">{error}</p>}
      {solution && <section className="lesson-python-solution"><h3>Reference solution</h3><pre className="lesson-code"><code>{solution.solutionCode}</code></pre><p>{solution.solutionExplanation}</p></section>}
    </div>
  )
}

function FramePreview({ html }) {
  return (
    <iframe
      className="learning-preview-frame"
      title="HTML code preview"
      sandbox=""
      referrerPolicy="no-referrer"
      srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">${html}`}
    />
  )
}

function HtmlEditor({ initialCode, onSubmit, submitting, submission }) {
  const [code, setCode] = useState(initialCode || EXAMPLE_HTML)
  const [preview, setPreview] = useState(initialCode || EXAMPLE_HTML)

  return (
    <section className="learning-editor">
      <div className="learning-editor-head">
        <div><p className="eyebrow">TRY IT YOURSELF</p><h2>HTML practice editor</h2></div>
        <div className="learning-editor-actions">
          <button type="button" className="button button-outline button-small" onClick={() => { const resetCode = initialCode || EXAMPLE_HTML; setCode(resetCode); setPreview(resetCode) }}>Reset</button>
          <button type="button" className="button button-dark button-small" onClick={() => setPreview(code)}>Run preview</button>
        </div>
      </div>
      <label className="learning-editor-label" htmlFor="learning-html-code">Your HTML</label>
      <textarea
        id="learning-html-code"
        className="learning-code-input"
        spellCheck="false"
        value={code}
        onChange={(event) => { setCode(event.target.value); setPreview(event.target.value) }}
        aria-describedby="learning-preview-note"
      />
      <div className="learning-preview-title"><strong>Live preview</strong><span>Runs only in a restricted sandbox</span></div>
      <FramePreview html={preview} />
      <p className="learning-preview-note" id="learning-preview-note">Scripts, network access, and form submissions are disabled in this preview.</p>
      {onSubmit && (
        <div className="learning-submit-row">
          <button type="button" className="button button-dark" disabled={submitting} onClick={() => onSubmit(code)}>
            {submitting ? 'Checking…' : 'Submit answer'}
          </button>
          {submission && <span role="status">{submission.message}</span>}
        </div>
      )}
      {submission?.data?.results && (
        <ul className="learning-check-results" aria-label="Exercise requirement results">
          {submission.data.results.map((result) => (
            <li key={result.requirementIndex} className={result.passed ? 'is-passed' : 'is-pending'}>
              <span aria-hidden="true">{result.passed ? '✓' : '○'}</span> Requirement {result.requirementIndex + 1}: {result.passed ? 'met' : 'not met yet'}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function StatePanel({ loading, error, onRetry, children }) {
  if (loading) return <div className="learning-state" role="status"><span className="spinner" /> Loading learning content…</div>
  if (error) return <div className="learning-state learning-error" role="alert"><strong>{error}</strong><button className="button button-outline button-small" onClick={onRetry}>Try again</button></div>
  return children
}

function LessonLearningView({
  lesson,
  token,
  user,
  submission,
  submitting,
  onComplete,
  onBookmark,
  onSubmitExercise,
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [openModules, setOpenModules] = useState(() => new Set([String(lesson.module?._id)]))
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [completeLoading, setCompleteLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState('')
  const [actionFailed, setActionFailed] = useState(false)
  const completedIds = new Set(lesson.learningProgress?.completedLessonIds || [])
  const allLessons = lesson.modules.flatMap((module) => module.lessons || [])
  const currentIndex = allLessons.findIndex((item) => String(item._id) === String(lesson._id))
  const previous = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null
  const totalLessons = lesson.learningProgress?.totalLessons || allLessons.length
  const completedCount = lesson.learningProgress?.completedLessons || completedIds.size
  const progressPercent = lesson.learningProgress?.percentage ||
    (totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0)
  const isComplete = completedIds.has(String(lesson._id))

  async function handleBookmark() {
    setBookmarkLoading(true)
    setActionMessage('')
    setActionFailed(false)
    try {
      const result = await onBookmark(lesson._id, !lesson.isBookmarked)
      setActionMessage(result?.message || 'Bookmark updated.')
    } catch (error) {
      setActionMessage(error.message)
      setActionFailed(true)
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function handleComplete() {
    if (isComplete) return
    setCompleteLoading(true)
    setActionMessage('')
    setActionFailed(false)
    try {
      const result = await onComplete(lesson._id)
      setActionMessage(result?.message || 'Lesson marked complete.')
    } catch (error) {
      setActionMessage(error.message)
      setActionFailed(true)
    } finally {
      setCompleteLoading(false)
    }
  }

  function toggleModule(moduleId) {
    setOpenModules((current) => {
      const nextOpen = new Set(current)
      if (nextOpen.has(moduleId)) nextOpen.delete(moduleId)
      else nextOpen.add(moduleId)
      return nextOpen
    })
  }

  return (
    <div className={`lesson-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}${mobileSidebarOpen ? ' mobile-sidebar-open' : ''}`}>
      <header className="lesson-topbar">
        <div className="lesson-topbar-brand">
          <button className="lesson-icon-button lesson-mobile-menu" type="button" aria-label={mobileSidebarOpen ? 'Close course menu' : 'Open course menu'} onClick={() => setMobileSidebarOpen((open) => !open)}>
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <a className="lesson-brand" href="#/learning-paths" aria-label="LearnHub learning paths">
            <span className="lesson-brand-icon"><GraduationCap size={19} aria-hidden="true" /></span>
            <span>Learn<span>Hub</span></span>
          </a>
        </div>
        <div className="lesson-topbar-course">
          <LearningLink href={`${ROOT}/${encodeURIComponent(lesson.path.slug)}`}>{lesson.path.title}</LearningLink>
          <ChevronRight size={15} aria-hidden="true" />
          <span>{lesson.module.title}</span>
          <ChevronRight size={15} aria-hidden="true" />
          <strong>{lesson.title}</strong>
        </div>
        <div className="lesson-topbar-profile">
          <LearningLink href={`${ROOT}/bookmarks`} className="lesson-saved-link"><Bookmark size={17} /> <span>Saved lessons</span></LearningLink>
          {user ? (
            <span className="lesson-profile" title={user.name || user.email}>
              <span className="lesson-avatar">{(user.name || user.email || 'S').trim().slice(0, 1).toUpperCase()}</span>
              <span>{user.name || 'Student'}</span>
            </span>
          ) : <a className="lesson-signin" href="#/login">Sign in</a>}
        </div>
      </header>

      {mobileSidebarOpen && <button className="lesson-drawer-backdrop" type="button" aria-label="Close module navigation" onClick={() => setMobileSidebarOpen(false)} />}
      <div className="lesson-workspace">
        <aside className="lesson-sidebar" aria-label="Learning path curriculum">
          <div className="lesson-sidebar-head">
            {!sidebarCollapsed && <div><p>YOUR CURRICULUM</p><strong>{lesson.path.title}</strong></div>}
            <button className="lesson-icon-button lesson-collapse-button" type="button" aria-label={sidebarCollapsed ? 'Expand course sidebar' : 'Collapse course sidebar'} onClick={() => setSidebarCollapsed((value) => !value)}>
              {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>
          {!sidebarCollapsed && (
            <div className="lesson-sidebar-progress">
              <div><span>Course progress</span><strong>{progressPercent}%</strong></div>
              <div className="lesson-progress-track" role="progressbar" aria-label="Learning path progress" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progressPercent}%` }} /></div>
              <small>{completedCount} of {totalLessons} lessons complete</small>
            </div>
          )}
          <nav className="lesson-module-nav" aria-label="Modules and lessons">
            {lesson.modules.map((module) => {
              const isOpen = openModules.has(String(module._id))
              const moduleCompleted = (module.lessons || []).length > 0 && module.lessons.every((item) => completedIds.has(String(item._id)))
              return (
                <section className="lesson-nav-module" key={module._id}>
                  <button
                    className={`lesson-module-toggle${String(module._id) === String(lesson.module._id) ? ' is-current' : ''}`}
                    type="button"
                    aria-expanded={isOpen}
                    title={sidebarCollapsed ? module.title : undefined}
                    onClick={() => toggleModule(String(module._id))}
                  >
                    <span className="lesson-module-number">{moduleCompleted ? <Check size={15} /> : String(module.order).padStart(2, '0')}</span>
                    {!sidebarCollapsed && <><span className="lesson-module-name">{module.title}</span><ChevronDown className={isOpen ? 'is-open' : ''} size={16} /></>}
                  </button>
                  {isOpen && !sidebarCollapsed && (
                    <div className="lesson-nav-lessons">
                      {(module.lessons || []).map((item) => {
                        const active = String(item._id) === String(lesson._id)
                        const done = completedIds.has(String(item._id))
                        return (
                          <LearningLink
                            key={item._id}
                            href={`${ROOT}/lessons/${encodeURIComponent(item._id)}`}
                            className={`lesson-nav-item${active ? ' is-current' : ''}`}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setMobileSidebarOpen(false)}
                          >
                            {done ? <Check size={15} aria-label="Completed" /> : <Circle size={13} aria-hidden="true" />}
                            <span>{item.title}</span>
                          </LearningLink>
                        )
                      })}
                    </div>
                  )}
                </section>
              )
            })}
          </nav>
          <LearningLink href={`${ROOT}/progress`} className="lesson-sidebar-footer"><BookOpen size={17} /><span>My learning progress</span></LearningLink>
        </aside>

        <div className="lesson-content-area">
          <article className="lesson-article">
            <div className="lesson-content-toolbar">
              <span className="lesson-breadcrumb-label">{lesson.module.title} <ChevronRight size={14} /> Lesson {lesson.order}</span>
              <span className="lesson-time"><Clock3 size={15} /> {lesson.estimatedMinutes} min</span>
            </div>
            <header className="lesson-heading">
              <p className="lesson-eyebrow">LESSON {String(lesson.order).padStart(2, '0')}</p>
              <h1>{lesson.title}</h1>
              <p className="lesson-intro">{lesson.content.introduction}</p>
            </header>
            <section className="lesson-objectives">
              <h2>What you’ll learn</h2>
              <ul>{lesson.content.objectives.map((objective) => <li key={objective}><Check size={16} aria-hidden="true" />{objective}</li>)}</ul>
            </section>
            <div className="lesson-prose">
              {lesson.content.explanation.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
            </div>
            <section className="lesson-terms"><h2>Key terms</h2><dl>{lesson.content.terminology.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.definition}</dd></div>)}</dl></section>
            <section className="lesson-code-section">
              <div className="lesson-section-heading"><div><p>CODE WALKTHROUGH</p><h2>Example</h2></div><span>{lesson.exercise?.language === 'python' ? 'PYTHON' : 'HTML'}</span></div>
              <pre className="lesson-code"><code>{lesson.content.codeExample.code}</code></pre>
              <p className="lesson-code-output">{lesson.content.codeExample.output}</p>
              <ul className="lesson-code-notes">{lesson.content.codeExample.lines.map((line) => <li key={line}>{line}</li>)}</ul>
            </section>
            <section className="lesson-note-block"><h2>Syntax reference</h2><pre className="lesson-code"><code>{lesson.content.syntax}</code></pre></section>
            <section className="lesson-prose"><h2>Common mistakes</h2><ul>{lesson.content.commonMistakes.map((item) => <li key={item}>{item}</li>)}</ul></section>
            <section className="lesson-note-block lesson-tip"><h2>Best practices</h2><ul>{lesson.content.bestPractices.map((item) => <li key={item}>{item}</li>)}</ul></section>
            {lesson.exercise && (
              <section className="lesson-exercise">
                <div className="lesson-section-heading"><div><p>HANDS-ON PRACTICE</p><h2>{lesson.exercise.title}</h2></div></div>
                <p>{lesson.exercise.instructions}</p>
                <ul>{lesson.exercise.hints.map((hint) => <li key={hint}>{hint}</li>)}</ul>
                lesson.exercise.language === 'python'
                  ? <PythonPractice key={lesson.exercise.id} exercise={lesson.exercise} token={token} user={user} />
                  : <HtmlEditor
                    key={lesson.exercise.id}
                    initialCode={lesson.exercise.starterCode}
                    submitting={submitting}
                    submission={submission}
                    onSubmit={(html) => onSubmitExercise(lesson.exercise.id, html)}
                  />
              </section>
            )}
            {lesson.quiz && <LearningLink className="lesson-related-quiz" href={`${ROOT}/quizzes/${encodeURIComponent(lesson.quiz.id)}`}>Continue to lesson quiz <ChevronRight size={17} /></LearningLink>}
            <section className="lesson-summary"><h2>Lesson summary</h2><p>{lesson.content.summary}</p></section>
            <nav className="lesson-prev-next" aria-label="Lesson navigation">
              {previous ? <LearningLink href={`${ROOT}/lessons/${encodeURIComponent(previous._id)}`} className="lesson-prev-next-link"><ChevronLeft size={17} /><span><small>PREVIOUS LESSON</small><strong>{previous.title}</strong></span></LearningLink> : <span />}
              {next && <LearningLink href={`${ROOT}/lessons/${encodeURIComponent(next._id)}`} className="lesson-prev-next-link is-next"><span><small>NEXT LESSON</small><strong>{next.title}</strong></span><ChevronRight size={17} /> </LearningLink>}
            </nav>
            <div className="lesson-completion-bar">
              <div><strong>{isComplete ? 'Lesson completed' : 'Finished this lesson?'}</strong><span>{isComplete ? 'Your progress is saved to your account.' : 'Mark it complete when you’re ready.'}</span></div>
              <button type="button" className={`lesson-complete-button${isComplete ? ' is-complete' : ''}`} onClick={handleComplete} disabled={completeLoading || isComplete || !user}>
                {isComplete ? <><Check size={17} /> Completed</> : completeLoading ? 'Saving…' : 'Mark as Complete'}
              </button>
            </div>
            {actionMessage && <p className={`lesson-action-message${actionFailed ? ' is-error' : ''}`} role={actionFailed ? 'alert' : 'status'}>{actionMessage}</p>}
          </article>
        </div>

        <aside className="lesson-tools" aria-label="Lesson tools">
          <section className="lesson-tool-card">
            <p className="lesson-tools-eyebrow">LESSON DETAILS</p>
            <h2>{lesson.module.title}</h2>
            <div className="lesson-detail-row"><Clock3 size={17} /><span>Estimated time</span><strong>{lesson.estimatedMinutes} min</strong></div>
            <div className="lesson-detail-row"><Check size={17} /><span>Status</span><strong>{isComplete ? 'Complete' : 'In progress'}</strong></div>
            <button type="button" className={`lesson-bookmark-button${lesson.isBookmarked ? ' is-saved' : ''}`} onClick={handleBookmark} disabled={bookmarkLoading || !user} aria-pressed={Boolean(lesson.isBookmarked)} aria-label={lesson.isBookmarked ? 'Remove lesson bookmark' : 'Bookmark lesson'}>
              <Bookmark size={19} fill={lesson.isBookmarked ? 'currentColor' : 'none'} />
              <span>{bookmarkLoading ? 'Saving…' : lesson.isBookmarked ? 'Saved lesson' : 'Bookmark lesson'}</span>
            </button>
            {!user && <p className="lesson-tool-hint"><a href="#/login">Sign in</a> to save bookmarks and track your progress.</p>}
          </section>
          <section className="lesson-tool-card lesson-course-progress">
            <p className="lesson-tools-eyebrow">YOUR PROGRESS</p>
            <strong>{progressPercent}%</strong>
            <span>{completedCount} of {totalLessons} lessons complete</span>
            <div className="lesson-progress-track" role="progressbar" aria-label="Learning path progress" aria-valuenow={progressPercent} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${progressPercent}%` }} /></div>
          </section>
          {next && <LearningLink className="lesson-next-card" href={`${ROOT}/lessons/${encodeURIComponent(next._id)}`}><span>UP NEXT</span><strong>{next.title}</strong><span>Continue <ChevronRight size={15} /></span></LearningLink>}
        </aside>
      </div>
    </div>
  )
}

function LearningPaths({ token, user }) {
  const route = routeFromHash()
  const [requestState, setRequestState] = useState({ routeKey: '', loading: true, error: '', data: null })
  const [submission, setSubmission] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState({})
  const routeKey = JSON.stringify(route)
  const fetchPage = useCallback(async () => {
    let data
    if (route.page === 'paths') {
      data = (await apiRequest('/learning/paths', { token })).data
    } else if (route.page === 'overview') {
      const [path, modules] = await Promise.all([
        apiRequest(`/learning/paths/${encodeURIComponent(route.slug)}`, { token }),
        apiRequest(`/learning/paths/${encodeURIComponent(route.slug)}/modules`, { token }),
      ])
      data = { ...path.data, modules: modules.data }
    } else if (route.page === 'module') {
      const [module, assessment] = await Promise.all([
        apiRequest(`/learning/modules/${encodeURIComponent(route.id)}`, { token }),
        apiRequest(`/learning/modules/${encodeURIComponent(route.id)}/assessment`, { token }).catch(() => null),
      ])
      data = { ...module.data, assessment: assessment?.data || null }
    } else if (route.page === 'lesson') {
      const lesson = await apiRequest(`/learning/lessons/${encodeURIComponent(route.id)}`, { token })
      const quiz = await apiRequest(`/learning/lessons/${encodeURIComponent(route.id)}/quiz`, { token }).catch(() => null)
      const modules = await apiRequest(`/learning/paths/${encodeURIComponent(lesson.data.path.slug)}/modules`, { token })
      data = { ...lesson.data, quiz: quiz?.data || null, modules: modules.data }
      if (token && user?.role === 'STUDENT') {
        const [progress, bookmarks] = await Promise.all([
          apiRequest('/learning/progress/me', { token }),
          apiRequest('/learning/bookmarks/me', { token }),
          apiRequest(`/learning/lessons/${encodeURIComponent(route.id)}/visit`, { token, method: 'PATCH' }),
        ])
        data.learningProgress = progress.data.find((item) => item.path.slug === lesson.data.path.slug) || null
        data.isBookmarked = bookmarks.data.some((item) => String(item.lesson._id) === String(route.id))
      }
    } else if (route.page === 'quiz') {
      data = (await apiRequest(`/learning/quizzes/${encodeURIComponent(route.id)}`, { token })).data
    } else if (route.page === 'final-assessment') {
      data = (await apiRequest(`/learning/paths/${encodeURIComponent(route.slug)}/assessment`, { token })).data
    } else if (route.page === 'projects') {
      if (!token || user?.role !== 'STUDENT') throw new Error('Log in with a student account to view project submission status.')
      data = (await apiRequest(`/learning/paths/${encodeURIComponent(route.slug)}/projects`, { token })).data
    } else if (route.page === 'progress') {
      if (!token || user?.role !== 'STUDENT') throw new Error('Log in with a student account to view your learning progress.')
      data = (await apiRequest('/learning/progress/me', { token })).data
    } else if (route.page === 'bookmarks') {
      if (!token || user?.role !== 'STUDENT') throw new Error('Log in with a student account to view saved lessons.')
      data = (await apiRequest('/learning/bookmarks/me', { token })).data
    }
    return data
  }, [route.page, route.id, route.slug, token, user])

  useEffect(() => {
    let active = true
    fetchPage().then((data) => {
      if (active) setRequestState({ routeKey, loading: false, error: '', data })
    }).catch((error) => {
      if (active) setRequestState({ routeKey, loading: false, error: error.message, data: null })
    })
    return () => { active = false }
  }, [fetchPage, routeKey])

  async function loadPage() {
    setRequestState({ routeKey, loading: true, error: '', data: null })
    try {
      setRequestState({ routeKey, loading: false, error: '', data: await fetchPage() })
    } catch (error) {
      setRequestState({ routeKey, loading: false, error: error.message, data: null })
    }
  }

  async function submitExercise(exerciseId, html) {
    if (!token || user?.role !== 'STUDENT') {
      setSubmission({ message: 'Log in with a student account to submit your work.' })
      return
    }
    setSubmitting(true)
    try {
      const result = await apiRequest(`/learning/exercises/${encodeURIComponent(exerciseId)}/submit`, {
        token,
        method: 'POST',
        body: JSON.stringify({ html }),
      })
      setSubmission(result)
    } catch (error) {
      setSubmission({ message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function submitQuiz(quiz) {
    if (!token || user?.role !== 'STUDENT') {
      setSubmission({ message: 'Log in with a student account to submit your answers.' })
      return
    }
    const payload = quiz.questions.map((question) => ({
      questionKey: question.questionKey,
      ...(['practical', 'short-answer'].includes(question.type)
        ? { response: answers[question.questionKey] ?? question.starterCode ?? '' }
        : { choiceId: answers[question.questionKey] || '' }),
    }))
    setSubmitting(true)
    try {
      setSubmission(await apiRequest(`/learning/quizzes/${encodeURIComponent(quiz.id)}/submit`, {
        token,
        method: 'POST',
        body: JSON.stringify({ answers: payload }),
      }))
    } catch (error) {
      setSubmission({ message: error.message })
    } finally {
      setSubmitting(false)
    }
  }

  async function completeLesson(lessonId) {
    if (!token || user?.role !== 'STUDENT') {
      setSubmission({ message: 'Log in with a student account to save lesson completion.' })
      return
    }
    try {
      const result = await apiRequest(`/learning/lessons/${encodeURIComponent(lessonId)}/complete`, {
        token,
        method: 'POST',
        body: JSON.stringify({}),
      })
      setRequestState((current) => {
        if (current.routeKey !== routeKey || !current.data) return current
        const completedIds = new Set(current.data.learningProgress?.completedLessonIds || [])
        completedIds.add(String(lessonId))
        return {
          ...current,
          data: {
            ...current.data,
            learningProgress: {
              ...(current.data.learningProgress || {}),
              completedLessonIds: [...completedIds],
              completedLessons: result.data.completedLessons,
              totalLessons: result.data.totalLessons,
              percentage: result.data.percentage,
            },
          },
        }
      })
      setSubmission({ message: result.message, data: result.data })
      return result
    } catch (error) {
      setSubmission({ message: error.message })
      throw error
    }
  }

  async function toggleBookmark(lessonId, bookmarked) {
    if (!token || user?.role !== 'STUDENT') {
      setSubmission({ message: 'Log in with a student account to save lessons.' })
      return
    }
    try {
      const result = await apiRequest(`/learning/lessons/${encodeURIComponent(lessonId)}/bookmark`, {
        token,
        method: 'PUT',
        body: JSON.stringify({ bookmarked }),
      })
      setRequestState((current) => current.routeKey === routeKey && current.data
        ? { ...current, data: { ...current.data, isBookmarked: bookmarked } }
        : current)
      setSubmission({ message: result.message })
      return result
    } catch (error) {
      setSubmission({ message: error.message })
      throw error
    }
  }
  const statePanel = (children) => (
    <StatePanel
      loading={requestState.routeKey !== routeKey || requestState.loading}
      error={requestState.routeKey === routeKey ? requestState.error : ''}
      onRetry={() => {
        setRequestState({ routeKey, loading: true, error: '', data: null })
        loadPage()
      }}
    >
      {children}
    </StatePanel>
  )

  return (
    <main className={`learning-main page-main${route.page === 'lesson' ? ' lesson-page-root' : ''}`}>
      <nav className="learning-breadcrumbs" aria-label="Learning path navigation">
        <LearningLink href={ROOT}>Learning Paths</LearningLink>
        <LearningLink href={`${ROOT}/progress`}>My Progress</LearningLink>
      </nav>
      {route.page === 'paths' && statePanel(
        <section>
          <header className="learning-page-heading"><p className="eyebrow">STRUCTURED LEARNING</p><h1>Learning Paths</h1><p>Build programming skills through guided lessons, hands-on exercises, and assessments.</p></header>
          <div className="learning-path-grid">
            {requestState.data?.map((path) => (
              <article className="learning-path-card" key={path._id}>
                <LearningPathThumbnail path={path} />
                <p className="eyebrow">{path.subject === 'python' ? `PYTHON · ${path.trackKey}` : path.language || 'LEARNING PATH'}</p><h2>{path.title}</h2><p>{path.subtitle}</p>
                {path.estimatedHours && <p className="learning-path-time">About {path.estimatedHours} hours{path.minimumPythonVersion ? ` · Python ${path.minimumPythonVersion}+` : ''}</p>}
                {!path.access?.allowed && <p className="learning-prerequisite-label">Locked: {path.access?.incompleteSlugs?.join(', ') || 'student sign-in required'}</p>}
                <p className="learning-counts">{path.moduleCount} modules <span>·</span> {path.lessonCount} lessons</p>
                <LearningLink className="button button-dark" href={`${ROOT}/${encodeURIComponent(path.slug)}`}>Explore path <span aria-hidden="true">→</span></LearningLink>
              </article>
            ))}
            {!requestState.data?.length && <div className="learning-state">No published learning paths are available yet.</div>}
          </div>
          <section className="learning-future-tracks" aria-labelledby="learning-future-tracks-title">
            <p className="eyebrow">FUTURE PYTHON SPECIALIZATIONS</p><h2 id="learning-future-tracks-title">Planned after Python Fundamentals</h2>
            <div>{PLANNED_PYTHON_TRACKS.map((title) => <article className="learning-future-track" key={title}><strong>{title}</strong><span>Not published · requires Python Fundamentals</span></article>)}</div>
          </section>
        </section>,
      )}
      {route.page === 'overview' && statePanel(requestState.data && (
        <section>
          <header className="learning-page-heading"><p className="eyebrow">{requestState.data.path.language || 'LEARNING PATH'}</p><h1>{requestState.data.path.title}</h1><p>{requestState.data.path.subtitle}</p><p>{requestState.data.path.description}</p></header>
          {!requestState.data.access?.allowed && <div className="learning-prerequisite-notice" role="status"><strong>This path is locked.</strong><p>Complete the required Learning Path before opening lessons or assessments.</p>{requestState.data.access?.incompleteSlugs?.map((slug) => <LearningLink key={slug} href={`${ROOT}/${encodeURIComponent(slug)}`}>{slug}</LearningLink>)}</div>}
          <div className="learning-action-row">
            {requestState.data.access?.allowed !== false && <LearningLink className="button button-dark" href={`${ROOT}/modules/${encodeURIComponent(requestState.data.modules[0]?._id || '')}`}>Start learning</LearningLink>}
            {requestState.data.access?.allowed !== false && <LearningLink className="button button-outline" href={`${ROOT}/${encodeURIComponent(route.slug)}/projects`}>Final projects</LearningLink>}
            {requestState.data.access?.allowed !== false && <LearningLink className="button button-outline" href={`${ROOT}/${encodeURIComponent(route.slug)}/assessment`}>Final assessment</LearningLink>}
          </div>
          <section className="learning-section"><p className="eyebrow">CURRICULUM</p><h2>{requestState.data.moduleCount} modules · {requestState.data.lessonCount} lessons</h2>
            <div className="learning-module-list">{requestState.data.modules.map((module) => (
              <article className="learning-module-card" key={module._id}>
                <span className="learning-order">{String(module.order).padStart(2, '0')}</span><div><h3>{module.title}</h3><p>{module.summary}</p><small>{module.lessonCount} lessons</small></div>
                {requestState.data.access?.allowed === false
                  ? <span className="text-link" aria-disabled="true">Locked by prerequisite</span>
                  : <LearningLink className="text-link" href={`${ROOT}/modules/${encodeURIComponent(module._id)}`}>Open module →</LearningLink>}
              </article>
            ))}</div>
          </section>
        </section>
      ))}
      {route.page === 'module' && statePanel(requestState.data && (
        <section>
          <header className="learning-page-heading"><p className="eyebrow">MODULE {requestState.data.module.order}</p><h1>{requestState.data.module.title}</h1><p>{requestState.data.module.summary}</p></header>
          <ul className="learning-objectives">{requestState.data.module.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>
          {requestState.data.assessment && <LearningLink className="button button-outline" href={`${ROOT}/quizzes/${encodeURIComponent(requestState.data.assessment.id)}`}>Take module assessment</LearningLink>}
          <div className="learning-module-list">{requestState.data.lessons.map((lesson) => (
            <article className="learning-module-card" key={lesson._id}>
              <span className="learning-order">{String(lesson.order).padStart(2, '0')}</span><div><h2>{lesson.title}</h2><p>{lesson.content.introduction}</p><small>{lesson.estimatedMinutes} min</small></div>
              <LearningLink className="text-link" href={`${ROOT}/lessons/${encodeURIComponent(lesson._id)}`}>Study lesson →</LearningLink>
            </article>
          ))}</div>
        </section>
      ))}
      {route.page === 'lesson' && statePanel(requestState.data && (
        <LessonLearningView
          lesson={requestState.data}
          token={token}
          user={user?.role === 'STUDENT' ? user : null}
          submission={submission}
          submitting={submitting}
          onComplete={completeLesson}
          onBookmark={toggleBookmark}
          onSubmitExercise={submitExercise}
        />
      ))}
      {(route.page === 'quiz' || route.page === 'final-assessment') && statePanel(requestState.data && (
        <section className="learning-quiz">
          <header className="learning-page-heading"><p className="eyebrow">{requestState.data.scope} ASSESSMENT</p><h1>{requestState.data.title}</h1><p>Choose an answer for each question. Short-answer and practical responses are submitted for review and do not affect the automatically scored percentage.</p></header>
          {(() => {
            const questionCount = requestState.data.questions.length
            const answeredCount = requestState.data.questions.filter((question) => Boolean(answers[question.questionKey]?.trim())).length
            const completion = questionCount ? Math.round((answeredCount / questionCount) * 100) : 0
            return (
              <div className="learning-assessment-progress" role="progressbar" aria-label="Assessment completion" aria-valuenow={completion} aria-valuemin="0" aria-valuemax="100">
                <div><span>Assessment progress</span><strong>{answeredCount} of {questionCount} answered</strong></div>
                <span className="learning-assessment-track"><span style={{ width: `${completion}%` }} /></span>
              </div>
            )
          })()}
          {requestState.data.questions.map((question, index) => (
            <fieldset className="learning-question" key={question.questionKey}>
              <legend>{index + 1}. {question.prompt}</legend>
              {question.type === 'practical' ? (
                <textarea className="learning-code-input" value={answers[question.questionKey] ?? question.starterCode ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.questionKey]: event.target.value }))} rows={12} />
              ) : question.type === 'short-answer' ? (
                <textarea className="learning-short-answer-input" aria-label={`Short answer for question ${index + 1}`} value={answers[question.questionKey] ?? ''} onChange={(event) => setAnswers((current) => ({ ...current, [question.questionKey]: event.target.value }))} rows={4} />
              ) : question.choices.map((choice) => (
                <label key={choice.id} className="learning-choice"><input type="radio" name={question.questionKey} value={choice.id} checked={answers[question.questionKey] === choice.id} onChange={() => setAnswers((current) => ({ ...current, [question.questionKey]: choice.id }))} />{choice.text}</label>
              ))}
              {question.hints?.map((hint) => <p className="learning-hint" key={hint}>Hint: {hint}</p>)}
            </fieldset>
          ))}
          <button className="button button-dark" disabled={submitting} onClick={() => submitQuiz(requestState.data)}>{submitting ? 'Submitting…' : 'Submit assessment'}</button>
          {submission && <div className="learning-result" role="status"><h2>{submission.message}</h2>{submission.data?.score !== undefined && <p className={`learning-score${submission.data.passed ? ' is-passed' : ' is-failed'}`}>Score: {submission.data.correctCount}/{submission.data.questionCount} ({submission.data.score}%) · {submission.data.passed ? 'Passed' : 'Not passed yet'}</p>}{submission.data?.practicalReview && <p>{submission.data.practicalReview}</p>}{submission.data?.answers?.map((answer) => <p className={`learning-answer-feedback${answer.correct ? ' is-correct' : answer.submitted ? ' is-submitted' : ' is-incorrect'}`} key={answer.questionKey}>{answer.questionKey}: {answer.correct ? 'Correct' : answer.submitted ? 'Submitted for review' : 'Incorrect'}{answer.explanation ? ` — ${answer.explanation}` : ''}</p>)}</div>}
        </section>
      ))}
      {route.page === 'progress' && statePanel(requestState.data && (
        <section><header className="learning-page-heading"><p className="eyebrow">YOUR LEARNING</p><h1>My progress</h1><p>Your progress is private to your student account.</p></header>
          {requestState.data.map((item) => <article className="learning-progress-card" key={item.path.id}><div><p className="eyebrow">{item.path.title}</p><strong>{item.completedLessons} of {item.totalLessons} lessons complete</strong><span>{item.percentage}% complete · {item.completedModules} modules complete</span></div><div className="learning-progress-track"><span style={{ width: `${item.percentage}%` }} /></div>
            {item.lastVisitedLesson && <LearningLink className="text-link" href={`${ROOT}/lessons/${encodeURIComponent(item.lastVisitedLesson)}`}>Continue learning →</LearningLink>}
            <details><summary>Assessment and exercise attempts</summary><ul>{item.quizAttempts.map((attempt) => <li key={attempt.id}>{attempt.title}: {attempt.score}% ({attempt.passed ? 'passed' : 'try again'})</li>)}{item.exerciseAttempts.map((attempt) => <li key={attempt.id}>{attempt.title}: {attempt.passed ? 'passed' : 'attempted'}</li>)}</ul></details>
          </article>)}
        </section>
      ))}
      {route.page === 'bookmarks' && statePanel(requestState.data && (
        <section>
          <header className="learning-page-heading"><p className="eyebrow">YOUR SAVED LESSONS</p><h1>Bookmarks</h1><p>Lessons you saved for later.</p></header>
          {requestState.data.length ? <div className="learning-module-list">{requestState.data.map((item) => (
            <article className="learning-module-card" key={item.lesson._id}>
              <span className="learning-order"><Bookmark size={18} fill="currentColor" /></span>
              <div><h2>{item.lesson.title}</h2><p>{item.path.title} · {item.module.title}</p><small>{item.lesson.estimatedMinutes} min</small></div>
              <LearningLink className="text-link" href={`${ROOT}/lessons/${encodeURIComponent(item.lesson._id)}`}>Open lesson →</LearningLink>
            </article>
          ))}</div> : <div className="learning-state">You haven’t bookmarked any lessons yet.</div>}
        </section>
      ))}
      {route.page === 'projects' && statePanel(requestState.data && (
        <section><header className="learning-page-heading"><p className="eyebrow">CAPSTONE WORK</p><h1>{requestState.data.module.title}</h1><p>Complete each project using its documented evaluation method.</p></header>
          {requestState.data.projects.map(({ lesson, exercise, submission: projectSubmission }) => <article className="learning-project-card" key={lesson._id}>
            <p className="eyebrow">{exercise?.language === 'python' ? 'LOCAL SELF-CHECK · NOT RECORDED' : projectSubmission.passed ? 'PASSED' : projectSubmission.submitted ? 'IN PROGRESS' : 'NOT STARTED'}</p><h2>{lesson.title}</h2><p>{lesson.project?.description || exercise?.instructions}</p>
            {lesson.project?.learningObjectives?.length > 0 && <ul>{lesson.project.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}</ul>}
            <LearningLink className="button button-outline button-small" href={`${ROOT}/lessons/${encodeURIComponent(lesson._id)}`}>{exercise?.language === 'python' ? 'Open project' : projectSubmission.submitted ? 'Continue project' : 'Start project'}</LearningLink>
          </article>)}
        </section>
      ))}
    </main>
  )
}

export default LearningPaths
