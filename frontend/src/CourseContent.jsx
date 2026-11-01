import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { API_BASE, apiRequest } from './api'
import './CourseContent.css'

function messageFromResponse(response, body) {
  if (response.status < 200 || response.status >= 300 || body.success === false) {
    const error = new Error(body.message || 'The video upload failed.')
    error.status = response.status
    throw error
  }
  return body
}

function uploadVideo(courseId, sectionId, lessonId, file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open(
      'POST',
      `${API_BASE}/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionId)}/lessons/${encodeURIComponent(lessonId)}/video`,
    )
    request.setRequestHeader('Authorization', `Bearer ${token}`)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('error', () => reject(new Error('Could not connect to LearnHub. Check that the course server is running.')))
    request.addEventListener('load', () => {
      try {
        resolve(messageFromResponse(request, JSON.parse(request.responseText)))
      } catch (error) {
        reject(error)
      }
    })
    const formData = new FormData()
    formData.append('video', file)
    request.send(formData)
  })
}

function emptyLessonForm(sectionId = '') {
  return {
    sectionId,
    id: '',
    title: '',
    description: '',
    duration: '0',
    isPreview: false,
    resources: '',
  }
}

function parseResources(value) {
  if (!value.trim()) return []
  return value.split('\n').map((line) => {
    const separator = line.indexOf('|')
    if (separator < 1) throw new Error('Enter each resource as “Title | https://link”.')
    return {
      title: line.slice(0, separator).trim(),
      url: line.slice(separator + 1).trim(),
    }
  })
}

export function InstructorCourseBuilder({ courseId, token }) {
  const [sections, setSections] = useState([])
  const [sectionForm, setSectionForm] = useState({ id: '', title: '', description: '' })
  const [lessonForm, setLessonForm] = useState(emptyLessonForm())
  const [uploadState, setUploadState] = useState({})
  const [state, setState] = useState({ loading: true, saving: false, error: '', message: '' })

  const load = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: '' }))
    try {
      const result = await apiRequest(`/curriculum/courses/${encodeURIComponent(courseId)}/sections`, { token })
      if (!Array.isArray(result.data)) throw new Error('The server returned an invalid curriculum.')
      setSections(result.data)
      setState((current) => ({ ...current, loading: false, error: '' }))
    } catch (error) {
      setState((current) => ({ ...current, loading: false, error: error.message }))
    }
  }, [courseId, token])

  useEffect(() => { Promise.resolve().then(load) }, [load])

  async function saveSection(event) {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '', message: '' }))
    try {
      const editing = Boolean(sectionForm.id)
      const result = await apiRequest(
        editing
          ? `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(sectionForm.id)}`
          : `/curriculum/courses/${encodeURIComponent(courseId)}/sections`,
        {
          token,
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify({ title: sectionForm.title, description: sectionForm.description }),
        },
      )
      setSectionForm({ id: '', title: '', description: '' })
      setState({ loading: false, saving: false, error: '', message: result.message })
      await load()
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  async function deleteSection(section) {
    if (!window.confirm(`Delete “${section.title}” and all its lessons? This cannot be undone.`)) return
    try {
      const result = await apiRequest(
        `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(section._id)}`,
        { token, method: 'DELETE' },
      )
      setState((current) => ({ ...current, error: '', message: result.message }))
      await load()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  async function reorderSections(index, offset) {
    const next = [...sections]
    const target = index + offset
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setSections(next)
    try {
      const result = await apiRequest(`/curriculum/courses/${encodeURIComponent(courseId)}/sections/reorder`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ sectionIds: next.map((section) => section._id) }),
      })
      setState((current) => ({ ...current, error: '', message: result.message }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
      await load()
    }
  }

  async function saveLesson(event) {
    event.preventDefault()
    setState((current) => ({ ...current, saving: true, error: '', message: '' }))
    try {
      const resources = parseResources(lessonForm.resources)
      const editing = Boolean(lessonForm.id)
      const url = `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(lessonForm.sectionId)}`
      const result = await apiRequest(
        editing ? `${url}/lessons/${encodeURIComponent(lessonForm.id)}` : `${url}/lessons`,
        {
          token,
          method: editing ? 'PATCH' : 'POST',
          body: JSON.stringify({
            title: lessonForm.title,
            description: lessonForm.description,
            duration: Number(lessonForm.duration),
            isPreview: lessonForm.isPreview,
            resources,
          }),
        },
      )
      setLessonForm(emptyLessonForm())
      setState({ loading: false, saving: false, error: '', message: result.message })
      await load()
    } catch (error) {
      setState((current) => ({ ...current, saving: false, error: error.message }))
    }
  }

  async function deleteLesson(section, lesson) {
    if (!window.confirm(`Delete “${lesson.title}”? This cannot be undone.`)) return
    try {
      const result = await apiRequest(
        `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(section._id)}/lessons/${encodeURIComponent(lesson._id)}`,
        { token, method: 'DELETE' },
      )
      setState((current) => ({ ...current, error: '', message: result.message }))
      await load()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  async function reorderLessons(section, index, offset) {
    const lessons = [...section.lessons]
    const target = index + offset
    if (target < 0 || target >= lessons.length) return
    ;[lessons[index], lessons[target]] = [lessons[target], lessons[index]]
    setSections((current) => current.map((item) => item._id === section._id ? { ...item, lessons } : item))
    try {
      await apiRequest(
        `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(section._id)}/lessons/reorder`,
        {
          token,
          method: 'PATCH',
          body: JSON.stringify({ lessonIds: lessons.map((lesson) => lesson._id) }),
        },
      )
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
      await load()
    }
  }

  async function handleVideoUpload(section, lesson, file) {
    if (!file) return
    setUploadState((current) => ({ ...current, [lesson._id]: { progress: 0, error: '', message: '' } }))
    try {
      const result = await uploadVideo(
        courseId,
        section._id,
        lesson._id,
        file,
        token,
        (progress) => setUploadState((current) => ({
          ...current,
          [lesson._id]: { ...current[lesson._id], progress },
        })),
      )
      setUploadState((current) => ({
        ...current,
        [lesson._id]: { ...current[lesson._id], progress: 100, message: result.message, error: '' },
      }))
      await load()
    } catch (error) {
      setUploadState((current) => ({
        ...current,
        [lesson._id]: { ...current[lesson._id], error: error.message },
      }))
    }
  }

  async function deleteVideo(section, lesson) {
    try {
      const result = await apiRequest(
        `/curriculum/courses/${encodeURIComponent(courseId)}/sections/${encodeURIComponent(section._id)}/lessons/${encodeURIComponent(lesson._id)}/video`,
        { token, method: 'DELETE' },
      )
      setState((current) => ({ ...current, error: '', message: result.message }))
      await load()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  return (
    <main className="page-main curriculum-main">
      <header className="curriculum-heading">
        <div>
          <a className="back-link" href="#/dashboard">← Instructor dashboard</a>
          <p className="eyebrow">COURSE BUILDER</p>
          <h1>Manage your<br /><span>curriculum.</span></h1>
          <p>Add sections and lessons. Changes save as you make them.</p>
        </div>
        <a className="button button-outline" href={`#/learn/${encodeURIComponent(courseId)}`}>Preview course ↗</a>
      </header>

      {state.error && <div className="form-alert curriculum-alert" role="alert">{state.error}<button className="button button-outline button-small" onClick={load}>Try again</button></div>}
      {state.message && <div className="success-alert curriculum-alert" role="status">{state.message}</div>}

      <section className="curriculum-builder">
        <form className="curriculum-panel curriculum-section-form" onSubmit={saveSection}>
          <div className="curriculum-panel-heading">
            <div><p className="eyebrow">{sectionForm.id ? 'EDIT SECTION' : 'NEW SECTION'}</p><h2>{sectionForm.id ? 'Update section' : 'Build your outline'}</h2></div>
            {sectionForm.id && <button className="icon-button" type="button" aria-label="Cancel section edit" onClick={() => setSectionForm({ id: '', title: '', description: '' })}>×</button>}
          </div>
          <label className="form-field">Section title<input value={sectionForm.title} onChange={(event) => setSectionForm((current) => ({ ...current, title: event.target.value }))} maxLength={120} required /></label>
          <label className="form-field">Description <span className="form-hint">Optional</span><textarea rows="3" value={sectionForm.description} onChange={(event) => setSectionForm((current) => ({ ...current, description: event.target.value }))} maxLength={1000} /></label>
          <button className="button button-dark" type="submit" disabled={state.saving}>{state.saving ? 'Saving…' : sectionForm.id ? 'Save section' : 'Add section'}</button>
        </form>

        <div className="curriculum-outline">
          {state.loading ? <div className="state-card" role="status"><span className="spinner" /> Loading curriculum…</div> : sections.length === 0 ? (
            <div className="state-card"><strong>Your outline starts here</strong><span>Add a section to begin organizing course lessons.</span></div>
          ) : sections.map((section, sectionIndex) => (
            <article className="curriculum-section" key={section._id}>
              <header className="curriculum-section-header">
                <div><span className="curriculum-order">SECTION {String(sectionIndex + 1).padStart(2, '0')}</span><h2>{section.title}</h2>{section.description && <p>{section.description}</p>}</div>
                <div className="curriculum-actions">
                  <button className="button button-outline button-small" onClick={() => setSectionForm({ id: section._id, title: section.title, description: section.description || '' })}>Edit</button>
                  <button className="button button-danger button-small" onClick={() => deleteSection(section)}>Delete</button>
                  <button className="icon-button" aria-label="Move section up" disabled={sectionIndex === 0} onClick={() => reorderSections(sectionIndex, -1)}>↑</button>
                  <button className="icon-button" aria-label="Move section down" disabled={sectionIndex === sections.length - 1} onClick={() => reorderSections(sectionIndex, 1)}>↓</button>
                </div>
              </header>

              {section.lessons.map((lesson, lessonIndex) => {
                const transfer = uploadState[lesson._id]
                return (
                  <div className="curriculum-lesson" key={lesson._id}>
                    <div className="curriculum-lesson-main">
                      <span className="lesson-index">{String(lessonIndex + 1).padStart(2, '0')}</span>
                      <div><h3>{lesson.title}</h3><p>{lesson.duration || 0} min · {lesson.isPreview ? 'Free preview' : 'Enrolled students'} · {lesson.video ? 'Video ready' : 'No video yet'}</p></div>
                    </div>
                    {transfer?.progress > 0 && transfer.progress < 100 && <div className="upload-progress" role="status"><progress value={transfer.progress} max="100" /><span>Uploading video… {transfer.progress}%</span></div>}
                    {transfer?.message && <p className="upload-message" role="status">{transfer.message}</p>}
                    {transfer?.error && <p className="upload-error" role="alert">{transfer.error}</p>}
                    <div className="curriculum-actions">
                      <button className="button button-outline button-small" onClick={() => setLessonForm({
                        sectionId: section._id,
                        id: lesson._id,
                        title: lesson.title,
                        description: lesson.description || '',
                        duration: String(lesson.duration || 0),
                        isPreview: Boolean(lesson.isPreview),
                        resources: (lesson.resources || []).map((resource) => `${resource.title} | ${resource.url}`).join('\n'),
                      })}>Edit</button>
                      <button className="button button-danger button-small" onClick={() => deleteLesson(section, lesson)}>Delete</button>
                      <button className="icon-button" aria-label="Move lesson up" disabled={lessonIndex === 0} onClick={() => reorderLessons(section, lessonIndex, -1)}>↑</button>
                      <button className="icon-button" aria-label="Move lesson down" disabled={lessonIndex === section.lessons.length - 1} onClick={() => reorderLessons(section, lessonIndex, 1)}>↓</button>
                    </div>
                    <label className="upload-control">
                      <span>{lesson.video ? 'Replace video' : 'Upload video'}</span>
                      <input type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" onChange={(event) => {
                        handleVideoUpload(section, lesson, event.target.files?.[0])
                        event.target.value = ''
                      }} />
                    </label>
                    {lesson.video && <button className="text-link curriculum-delete-video" onClick={() => deleteVideo(section, lesson)}>Delete video</button>}
                  </div>
                )
              })}

              {lessonForm.sectionId === section._id ? (
                <form className="curriculum-lesson-form" onSubmit={saveLesson}>
                  <div className="curriculum-panel-heading"><h3>{lessonForm.id ? 'Edit lesson' : 'New lesson'}</h3><button className="icon-button" type="button" aria-label="Cancel lesson edit" onClick={() => setLessonForm(emptyLessonForm())}>×</button></div>
                  <label className="form-field">Lesson title<input value={lessonForm.title} onChange={(event) => setLessonForm((current) => ({ ...current, title: event.target.value }))} maxLength={160} required /></label>
                  <label className="form-field">Description<textarea rows="3" value={lessonForm.description} onChange={(event) => setLessonForm((current) => ({ ...current, description: event.target.value }))} maxLength={3000} /></label>
                  <label className="form-field">Duration in minutes<input type="number" min="0" max="10000" value={lessonForm.duration} onChange={(event) => setLessonForm((current) => ({ ...current, duration: event.target.value }))} required /></label>
                  <label className="form-field">Downloadable resources <span className="form-hint">One HTTPS link per line: title | URL</span><textarea rows="3" value={lessonForm.resources} onChange={(event) => setLessonForm((current) => ({ ...current, resources: event.target.value }))} placeholder="Course notes | https://example.com/notes.pdf" /></label>
                  <label className="check-field"><input type="checkbox" checked={lessonForm.isPreview} onChange={(event) => setLessonForm((current) => ({ ...current, isPreview: event.target.checked }))} /> Free preview lesson</label>
                  <div className="form-actions"><button className="button button-dark" type="submit" disabled={state.saving}>{state.saving ? 'Saving…' : 'Save lesson'}</button><button className="button button-outline" type="button" onClick={() => setLessonForm(emptyLessonForm())}>Cancel</button></div>
                </form>
              ) : (
                <button className="curriculum-add-lesson" onClick={() => setLessonForm(emptyLessonForm(section._id))}>＋ Add lesson</button>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export function StudentLearning({ courseId, lessonId, token }) {
  const [learning, setLearning] = useState(null)
  const [state, setState] = useState({ loading: true, error: '', message: '' })
  const visited = useRef(new Set())

  const load = useCallback(async () => {
    setState({ loading: true, error: '', message: '' })
    try {
      const result = await apiRequest(`/curriculum/courses/${encodeURIComponent(courseId)}/learning`, { token })
      setLearning(result.data)
      setState({ loading: false, error: '', message: '' })
    } catch (error) {
      setState({ loading: false, error: error.message, message: '' })
    }
  }, [courseId, token])

  useEffect(() => { Promise.resolve().then(load) }, [load])
  const allLessons = useMemo(() => (learning?.sections || []).flatMap((section) => (
    section.lessons.map((lesson) => ({ ...lesson, sectionTitle: section.title }))
  )), [learning])
  const selectedLesson = allLessons.find((lesson) => String(lesson._id) === String(lessonId)) ||
    allLessons.find((lesson) => !lesson.locked) ||
    allLessons[0]

  useEffect(() => {
    if (!learning?.enrolled || !token || !selectedLesson || selectedLesson.locked) return
    const key = `${courseId}:${selectedLesson._id}`
    if (visited.current.has(key)) return
    visited.current.add(key)
    apiRequest(`/curriculum/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(selectedLesson._id)}/view`, {
      token,
      method: 'POST',
    }).catch((error) => {
      visited.current.delete(key)
      setState((current) => ({ ...current, error: error.message }))
    })
  }, [courseId, learning, selectedLesson, token])

  async function markComplete(lesson) {
    setState((current) => ({ ...current, error: '', message: '' }))
    try {
      const result = await apiRequest(
        `/curriculum/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson._id)}/complete`,
        { token, method: 'POST' },
      )
      setLearning((current) => {
        if (!current) return current
        const sections = current.sections.map((section) => ({
          ...section,
          lessons: section.lessons.map((item) => item._id === lesson._id ? { ...item, completed: true } : item),
        }))
        const completedLessons = sections.flatMap((section) => section.lessons).filter((item) => item.completed).length
        const totalLessons = sections.flatMap((section) => section.lessons).length
        return {
          ...current,
          sections,
          progress: {
            ...current.progress,
            completedLessons,
            totalLessons,
            percentage: totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0,
          },
        }
      })
      setState((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  return (
    <main className="page-main learning-main">
      <header className="learning-heading">
        <a className="back-link" href={token ? '#/my-courses' : '#/courses'}>← {token ? 'My courses' : 'All courses'}</a>
        {learning && <><p className="eyebrow">YOUR LEARNING SPACE</p><h1>{learning.course.title}</h1>
          {learning.enrolled && <div className="learning-progress"><div><strong>{learning.progress.percentage}% complete</strong><span>{learning.progress.completedLessons} of {learning.progress.totalLessons} lessons</span></div><progress value={learning.progress.percentage} max="100" /></div>}
        </>}
      </header>
      {state.loading && !learning && <div className="state-card" role="status"><span className="spinner" /> Loading course…</div>}
      {state.error && <div className="form-alert curriculum-alert" role="alert">{state.error}<button className="button button-outline button-small" onClick={load}>Try again</button></div>}
      {state.message && <div className="success-alert curriculum-alert" role="status">{state.message}</div>}
      {learning && <div className="learning-layout">
        <section className="learning-player">
          {selectedLesson && !selectedLesson.locked ? (
            <>
              {selectedLesson.video?.url
                ? <video className="lesson-video" src={selectedLesson.video.url} controls playsInline preload="metadata" />
                : <div className="video-placeholder"><span aria-hidden="true">▶</span><p>Video lesson</p><small>The instructor has not uploaded a video yet.</small></div>}
              <p className="eyebrow">{selectedLesson.sectionTitle}</p>
              <h2>{selectedLesson.title}</h2>
              <p className="learning-description">{selectedLesson.description || 'Continue with this lesson at your own pace.'}</p>
              {selectedLesson.resources?.length > 0 && <div className="learning-resources"><h3>Learning resources</h3>{selectedLesson.resources.map((resource) => <a href={resource.url} key={resource.url} target="_blank" rel="noreferrer">{resource.title} <span aria-hidden="true">↗</span></a>)}</div>}
              {learning.enrolled && <button className="button button-dark" onClick={() => markComplete(selectedLesson)} disabled={selectedLesson.completed}>{selectedLesson.completed ? 'Lesson completed ✓' : 'Mark lesson complete'}</button>}
              {!learning.enrolled && selectedLesson.isPreview && <p className="preview-notice">You’re watching a free preview. <a href={`#/courses/${encodeURIComponent(courseId)}`}>Enroll to unlock every lesson.</a></p>}
            </>
          ) : (
            <div className="video-placeholder"><span aria-hidden="true">🔒</span><p>This lesson is locked</p><small>Enroll in this course to unlock the full curriculum.</small><a className="button button-dark" href={`#/courses/${encodeURIComponent(courseId)}`}>View course</a></div>
          )}
        </section>
        <aside className="learning-outline">
          <h2>Course content</h2>
          {learning.sections.map((section, sectionIndex) => <section className="learning-section" key={section._id}>
            <h3><span>SECTION {sectionIndex + 1}</span>{section.title}</h3>
            {section.lessons.map((lesson, lessonIndex) => (
              <button
                className={`learning-lesson${selectedLesson?._id === lesson._id ? ' is-active' : ''}${lesson.locked ? ' is-locked' : ''}`}
                key={lesson._id}
                onClick={() => lesson.locked ? null : window.location.hash = `#/learn/${encodeURIComponent(courseId)}/${encodeURIComponent(lesson._id)}`}
                disabled={lesson.locked}
              >
                <span className="learning-lesson-icon">{lesson.completed ? '✓' : lesson.locked ? '🔒' : lesson.isPreview ? '▶' : '○'}</span>
                <span><strong>{lesson.title}</strong><small>{lesson.duration || 0} min {lesson.isPreview ? '· Preview' : ''}</small></span>
                <span className="sr-only">{lessonIndex + 1}</span>
              </button>
            ))}
          </section>)}
          {!learning.enrolled && <p className="learning-locked-note">Preview lessons are open. Enroll to unlock the rest.</p>}
        </aside>
      </div>}
    </main>
  )
}
