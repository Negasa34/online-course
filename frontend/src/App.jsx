import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { InstructorCourseBuilder, StudentLearning } from './CourseContent'
import LearningPaths from './LearningPaths'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'learnhub_token'
const APP_YEAR = new Date().getFullYear()

async function apiRequest(path, { token, ...options } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })
  } catch {
    throw new Error('Could not connect to LearnHub. Check that the course server is running.')
  }

  let body
  try {
    body = await response.json()
  } catch {
    throw new Error('The server returned an unreadable response.')
  }

  if (!response.ok || body.success === false) {
    const error = new Error(body.message || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return body
}

function courseId(course) {
  return course?._id || course?.id
}

function instructorId(course) {
  const instructor = course?.instructor
  return typeof instructor === 'object' && instructor !== null
    ? instructor._id || instructor.id
    : instructor
}

function formatPrice(price) {
  return Number(price || 0) === 0
    ? 'Free'
    : new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(price)
}

function routeFromHash() {
  const path = window.location.hash.slice(1) || '/'
  if (/^\/learning-paths(?:\/|$)/.test(path)) return { page: 'learning' }
  const courseMatch = path.match(/^\/courses\/([^/]+)$/)
  if (courseMatch) return { page: 'course', id: decodeURIComponent(courseMatch[1]) }
  const curriculumMatch = path.match(/^\/curriculum\/([^/]+)$/)
  if (curriculumMatch) return { page: 'curriculum', courseId: decodeURIComponent(curriculumMatch[1]) }
  const learningMatch = path.match(/^\/learn\/([^/]+)(?:\/([^/]+))?$/)
  if (learningMatch) {
    return {
      page: 'learn',
      courseId: decodeURIComponent(learningMatch[1]),
      lessonId: learningMatch[2] ? decodeURIComponent(learningMatch[2]) : '',
    }
  }
  return { page: path.slice(1) || 'home' }
}

function navigate(path) {
  window.location.hash = path
}

function getDashboardPath(user) {
  return user?.role === 'ADMIN' ? '/admin' : '/dashboard'
}

function resolveRoleRoute(page, user) {
  const protectedPages = ['dashboard', 'my-courses', 'profile', 'settings', 'admin', 'curriculum']
  if (!user && protectedPages.includes(page)) return { page: 'login', redirect: '/login' }
  if (!user) return { page }

  if (page === 'login' || page === 'register') {
    const destination = getDashboardPath(user)
    return { page: user.role === 'ADMIN' ? 'admin' : 'dashboard', redirect: destination }
  }
  if (page === 'admin' && user.role !== 'ADMIN') return { page: 'dashboard', redirect: '/dashboard' }
  if (page === 'dashboard' && user.role === 'ADMIN') return { page: 'admin', redirect: '/admin' }
  if (page === 'curriculum' && user.role === 'STUDENT') return { page: 'dashboard', redirect: '/dashboard' }
  if (page === 'curriculum' && user.role === 'INSTRUCTOR' && !user.instructorApprovedAt) {
    return { page: 'dashboard', redirect: '/dashboard' }
  }
  if (page === 'instructor-apply' && (user.role === 'ADMIN' || (user.role === 'INSTRUCTOR' && user.instructorApprovedAt))) {
    const destination = getDashboardPath(user)
    return { page: user.role === 'ADMIN' ? 'admin' : 'dashboard', redirect: destination }
  }
  return { page }
}

function getAccountNavigation(user, page) {
  if (user?.role === 'STUDENT') {
    return [
      { label: 'My Courses', href: '#/my-courses', icon: 'courses', current: page === 'my-courses' },
      { label: 'Profile', href: '#/profile', icon: 'profile', current: page === 'profile' },
      { label: 'Settings', href: '#/settings', icon: 'settings', current: page === 'settings' },
      { label: 'Become an Instructor', href: '#/instructor-apply', icon: 'teach', current: page === 'instructor-apply' },
    ]
  }
  if (user?.role === 'INSTRUCTOR') {
    return [
      { label: 'Instructor Dashboard', href: '#/dashboard', icon: 'dashboard', current: page === 'dashboard' },
      { label: 'My Courses', href: '#/my-courses', icon: 'courses', current: page === 'my-courses' },
      { label: 'Profile', href: '#/profile', icon: 'profile', current: page === 'profile' },
      { label: 'Settings', href: '#/settings', icon: 'settings', current: page === 'settings' },
      ...(!user.instructorApprovedAt ? [{ label: 'Become an Instructor', href: '#/instructor-apply', icon: 'teach', current: page === 'instructor-apply' }] : []),
    ]
  }
  if (user?.role === 'ADMIN') {
    return [
      { label: 'Admin Dashboard', href: '#/admin', icon: 'admin', current: page === 'admin' },
      { label: 'Profile', href: '#/profile', icon: 'profile', current: page === 'profile' },
      { label: 'Settings', href: '#/settings', icon: 'settings', current: page === 'settings' },
    ]
  }
  return []
}

function Brand() {
  return (
    <a className="brand" href="#/" aria-label="LearnHub home">
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" focusable="false">
          <path d="M3 12.4 18 5l15 7.4L18 20 3 12.4Z" />
          <path d="M9 16v7.1c4.7 4.1 13.3 4.1 18 0V16l-9 4.5L9 16Z" />
          <path d="M32.8 13v8.2" />
          <circle cx="32.8" cy="23.2" r="1.5" />
        </svg>
      </span>
      <span className="brand-wordmark">Learn<span className="brand-accent">Hub</span></span>
    </a>
  )
}

function AccountMenuIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === 'courses' && <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8M8 11h8" /></>}
      {name === 'profile' && <><circle cx="12" cy="8" r="3.5" /><path d="M5 21a7 7 0 0 1 14 0" /></>}
      {name === 'settings' && <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.7a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.7-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.7a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.7 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.8Z" /></>}
      {name === 'teach' && <><path d="m2 9 10-5 10 5-10 5L2 9Z" /><path d="M6 11v5c3.5 3 8.5 3 12 0v-5M22 9v6" /></>}
      {name === 'dashboard' && <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="5" rx="1" /><rect x="13" y="10" width="8" height="11" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /></>}
      {name === 'admin' && <><path d="M12 3 20 6v5c0 5-3.4 8.1-8 10-4.6-1.9-8-5-8-10V6l8-3Z" /><path d="m9 12 2 2 4-4" /></>}
      {name === 'logout' && <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>}
    </svg>
  )
}

function AccountAvatar({ user }) {
  const [failedImage, setFailedImage] = useState('')
  const initials = (user.name || user.email || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <span className="account-avatar" aria-hidden="true">
      {user.profileImage && user.profileImage !== failedImage
        ? <img src={user.profileImage} alt="" onError={() => setFailedImage(user.profileImage)} />
        : initials}
    </span>
  )
}

function Header({ user, onLogout, page, searchValue, onSearch, onSearchSubmit }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const accountMenuRef = useRef(null)
  const accountMenuTriggerRef = useRef(null)

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 8)
    updateScroll()
    window.addEventListener('scroll', updateScroll, { passive: true })
    return () => window.removeEventListener('scroll', updateScroll)
  }, [])

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false)
    window.addEventListener('hashchange', closeMenu)
    return () => window.removeEventListener('hashchange', closeMenu)
  }, [])

  useEffect(() => {
    if (!accountMenuOpen) return undefined

    function handlePointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) setAccountMenuOpen(false)
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setAccountMenuOpen(false)
        accountMenuTriggerRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [accountMenuOpen])

  function handleAccountMenuKeyDown(event) {
    const items = [...(accountMenuRef.current?.querySelectorAll('[role="menuitem"]') || [])]
    const currentIndex = items.indexOf(document.activeElement)
    let nextIndex

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % items.length
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + items.length) % items.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = items.length - 1
    else return

    event.preventDefault()
    items[nextIndex]?.focus()
  }

  function openAccountMenuAt(event) {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    setAccountMenuOpen(true)
    requestAnimationFrame(() => {
      const items = accountMenuRef.current?.querySelectorAll('[role="menuitem"]')
      if (!items?.length) return
      items[event.key === 'ArrowUp' ? items.length - 1 : 0].focus()
    })
  }

  function submitSearch(event) {
    event.preventDefault()
    onSearchSubmit(searchValue)
    setMenuOpen(false)
  }

  const accountLinks = getAccountNavigation(user, page)

  return (
    <header className={`site-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="header-inner">
        <Brand />
        <nav className={`main-nav${menuOpen ? ' is-open' : ''}`} id="primary-navigation" aria-label="Main navigation">
          <a href="#/" aria-current={page === 'home' ? 'page' : undefined}>Home</a>
          <a href="#/courses" aria-current={page === 'courses' || page === 'course' ? 'page' : undefined}>Courses</a>
          <a href="#/learning-paths" aria-current={page === 'learning' ? 'page' : undefined}>Learning Paths</a>
          <a href="#/about" aria-current={page === 'about' ? 'page' : undefined}>About</a>
          <a href="#/contact" aria-current={page === 'contact' ? 'page' : undefined}>Contact</a>
        </nav>
        <form className="header-search" role="search" onSubmit={submitSearch}>
          <label className="sr-only" htmlFor="site-course-search">Search courses</label>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.4" /><path d="m16 16 4.2 4.2" /></svg>
          <input
            id="site-course-search"
            type="search"
            value={searchValue}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search courses"
          />
          <button type="submit" aria-label="Show matching courses">↵</button>
        </form>
        <div className="header-actions">
          {user ? (
            <div className="account-menu-wrap" ref={accountMenuRef}>
              <button
                ref={accountMenuTriggerRef}
                className="account-menu-trigger"
                type="button"
                aria-label={`Open account menu for ${user.name || user.email}`}
                aria-haspopup="menu"
                aria-expanded={accountMenuOpen}
                aria-controls="account-menu"
                onClick={() => setAccountMenuOpen((open) => !open)}
                onKeyDown={openAccountMenuAt}
              >
                <AccountAvatar user={user} />
              </button>
              <div
                className="account-menu"
                id="account-menu"
                role="menu"
                aria-label="Account navigation"
                hidden={!accountMenuOpen}
                onKeyDown={handleAccountMenuKeyDown}
              >
                <div className="account-menu-heading">
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                {accountLinks.map((item) => (
                  <a
                    key={item.label}
                    role="menuitem"
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    <AccountMenuIcon name={item.icon} />
                    <span>{item.label}</span>
                  </a>
                ))}
                <div className="account-menu-divider" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountMenuOpen(false)
                    onLogout()
                  }}
                >
                  <AccountMenuIcon name="logout" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <a className="button button-outline button-small nav-login" href="#/login" aria-current={page === 'login' ? 'page' : undefined}>Log in</a>
              <a className="button button-gold button-small" href="#/register" aria-current={page === 'register' ? 'page' : undefined}>Register <span aria-hidden="true">↗</span></a>
            </>
          )}
        </div>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>
    </header>
  )
}

function CourseCard({ course }) {
  const id = courseId(course)
  return (
    <article className="course-card">
      <div className="course-card-top">
        <span className="course-label">LEARNHUB COURSE</span>
        <span className="course-price">{formatPrice(course.price)}</span>
      </div>
      <h3>{course.title}</h3>
      <p>{course.description}</p>
      <a className="course-link" href={`#/courses/${encodeURIComponent(id)}`}>
        Explore course <span aria-hidden="true">↗</span>
      </a>
    </article>
  )
}

function CourseCollection({ courses, loading, error, onRetry, emptyTitle = 'Courses are on their way', emptyMessage = 'Check back soon for new learning opportunities.' }) {
  if (loading) {
    return <div className="state-card" role="status"><span className="spinner" /> Loading courses…</div>
  }
  if (error) {
    return (
      <div className="state-card state-error" role="alert">
        <strong>We couldn’t load courses.</strong>
        <span>{error}</span>
        <button className="button button-outline" onClick={onRetry}>Try again</button>
      </div>
    )
  }
  if (!courses.length) {
    return (
      <div className="state-card">
        <strong>{emptyTitle}</strong>
        <span>{emptyMessage}</span>
      </div>
    )
  }
  return <div className="course-grid">{courses.map((course) => <CourseCard key={courseId(course)} course={course} />)}</div>
}

function HomePage({ courses, loading, error, onRetry }) {
  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> LEARN SOMETHING THAT MOVES YOU</p>
            <h1>Make your next<br />move a <span>smart one.</span></h1>
            <p className="hero-description">Build real-world skills with courses made for curious minds and ambitious futures.</p>
            <div className="hero-actions">
              <a className="button button-dark" href="#/courses">Explore courses <span aria-hidden="true">↗</span></a>
              <a className="text-link" href="#/about">Why LearnHub? <span aria-hidden="true">→</span></a>
            </div>
            <div className="hero-note"><span className="note-check">✓</span> Learn at your own pace, on your own terms</div>
          </div>
          <div className="hero-art" aria-label="A student learning online">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-card art-card-back"><span className="art-mini-icon">✦</span><span>Keep growing</span><b>One lesson at a time</b></div>
            <div className="art-card art-card-front">
              <div className="art-topline"><span className="art-play">▶</span><span className="art-progress">YOUR NEXT CHAPTER</span></div>
              <div className="art-title">Curiosity<br />looks good<br /><span>on you.</span></div>
              <div className="art-bottom"><span>LEARNHUB / 01</span><span>↗</span></div>
            </div>
            <div className="art-spark spark-one">✳</div>
            <div className="art-spark spark-two">✦</div>
            <div className="art-caption">A little progress<br />goes a long way.</div>
          </div>
        </section>

        <section className="trust-strip" aria-label="LearnHub benefits">
          <span>Learn on your schedule</span><i />
          <span>Skills for what’s next</span><i />
          <span>Progress that feels yours</span>
        </section>

        <section className="section courses-section" id="courses">
          <div className="section-heading">
            <div><p className="eyebrow">A GOOD PLACE TO BEGIN</p><h2>Find your next <span>favorite.</span></h2></div>
            <a className="text-link" href="#/courses">All courses <span aria-hidden="true">→</span></a>
          </div>
          <CourseCollection courses={courses.slice(0, 3)} loading={loading} error={error} onRetry={onRetry} />
        </section>

        <section className="bottom-cta">
          <div><p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p><h2>Ready when you are.</h2></div>
          <a className="button button-light" href="#/courses">Browse courses <span aria-hidden="true">↗</span></a>
        </section>
      </main>
    </>
  )
}

function CatalogPage({ courses, loading, error, onRetry, search, onSearch }) {
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return courses
    return courses.filter((course) => `${course.title} ${course.description}`.toLowerCase().includes(term))
  }, [courses, search])

  return (
    <>
      <main className="page-main">
        <section className="page-intro">
          <p className="eyebrow">THE COURSE CATALOG</p>
          <h1>Small steps.<br /><span>Big possibilities.</span></h1>
          <p>Explore practical courses and find the skill you’d love to build next.</p>
        </section>
        <section className="section catalog-section">
          <div className="catalog-toolbar">
            <div><h2>Available courses</h2><p>Explore what’s open to learn right now.</p></div>
            <label className="search-field">
              <span className="sr-only">Search courses</span>
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => onSearch(event.target.value)} placeholder="Search courses" />
            </label>
          </div>
          <CourseCollection courses={filtered} loading={loading} error={error} onRetry={onRetry} emptyTitle={search ? 'No courses match that search' : 'No courses available yet'} />
        </section>
      </main>
    </>
  )
}

function AboutPage() {
  return (
    <>
      <main className="page-main">
        <section className="page-intro about-intro">
          <p className="eyebrow">A LITTLE ABOUT US</p>
          <h1>Learning should<br /><span>open doors.</span></h1>
          <p>LearnHub is a place to explore new ideas, grow useful skills, and feel good about the progress you make along the way.</p>
        </section>
        <section className="about-panel">
          <div className="about-stamp">LEARN<br />BUILD<br />GROW<span>✳</span></div>
          <div><p className="eyebrow">MADE FOR YOUR NEXT STEP</p><h2>Curiosity is a pretty great place to start.</h2><p>Whether you’re starting fresh or adding something new to your toolkit, find a course that fits where you want to go. Learn at your own pace and take your next step with confidence.</p><a className="text-link" href="#/courses">Explore the catalog <span aria-hidden="true">→</span></a></div>
        </section>
      </main>
    </>
  )
}

function ContactPage() {
  return (
    <>
      <main className="page-main">
        <section className="page-intro contact-intro">
          <p className="eyebrow">GET IN TOUCH</p>
          <h1>Let’s keep<br /><span>learning together.</span></h1>
          <p>We haven’t configured a public contact channel for LearnHub yet. No email address, phone number, or social account is published at this time.</p>
          <a className="button button-gold contact-catalog-link" href="#/courses">Explore courses <span aria-hidden="true">↗</span></a>
        </section>
      </main>
    </>
  )
}

function AuthPage({ mode, onSubmit, error, loading }) {
  const isRegister = mode === 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [validationError, setValidationError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')
    if (isRegister && (name.trim().length < 2 || name.trim().length > 80)) {
      setValidationError('Name must be between 2 and 80 characters.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setValidationError('Enter a valid email address.')
      return
    }
    if (!password || (isRegister && (password.length < 8 || new TextEncoder().encode(password).length > 72))) {
      setValidationError(isRegister ? 'Password must be at least 8 characters and at most 72 bytes.' : 'Enter your password.')
      return
    }
    if (isRegister && password !== confirmPassword) {
      setValidationError('Passwords do not match.')
      return
    }
    if (isRegister && !termsAccepted) {
      setValidationError('Please agree to the terms and privacy policy.')
      return
    }
    if (isRegister && profileImage && !/^https:\/\/.+/i.test(profileImage.trim())) {
      setValidationError('Profile photo must be an HTTPS URL.')
      return
    }
    await onSubmit(isRegister ? '/auth/register' : '/auth/login', {
      ...(isRegister ? { name: name.trim() } : {}),
      ...(isRegister ? { confirmPassword, termsAccepted, profileImage: profileImage.trim() } : {}),
      email: email.trim(),
      password,
    })
  }

  return (
    <main className="auth-layout">
      <div className="auth-aside">
        <Brand />
        <div><p className="eyebrow">A NEW SKILL IS CLOSER THAN YOU THINK</p><h1>Make room<br />for <span>what’s next.</span></h1><p>Good things happen when you keep learning.</p></div>
        <span className="auth-aside-foot">LEARNHUB / YOUR LEARNING, YOUR WAY</span>
      </div>
      <section className="auth-card">
        <p className="eyebrow">{isRegister ? 'YOUR JOURNEY STARTS HERE' : 'WELCOME BACK'}</p>
        <h2>{isRegister ? 'Create your account' : 'Log in to LearnHub'}</h2>
        <p className="auth-subtitle">{isRegister ? 'Make a little space for a lot of possibility.' : 'Pick up right where your curiosity left off.'}</p>
        {(validationError || error) && <div className="form-alert" role="alert">{validationError || error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegister && <label className="form-field">Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} /></label>}
          {isRegister && <label className="form-field">Profile photo URL <span className="form-hint">Optional; use an HTTPS image link.</span><input type="url" value={profileImage} onChange={(event) => setProfileImage(event.target.value)} placeholder="https://example.com/photo.jpg" /></label>}
          <label className="form-field">Email address<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="form-field">Password<input type="password" autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} required minLength={isRegister ? 8 : undefined} /></label>
          {isRegister && <label className="form-field">Confirm password<input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={8} /></label>}
          {isRegister && <p className="form-hint">At least 8 characters; password must be no more than 72 bytes.</p>}
          {isRegister && <label className="check-field"><input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} /> I agree to the terms and privacy policy.</label>}
          <button className="button button-dark auth-submit" type="submit" disabled={loading}>{loading ? 'Please wait…' : isRegister ? 'Create account' : 'Log in'} <span aria-hidden="true">↗</span></button>
        </form>
        <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to LearnHub?'} <a href={isRegister ? '#/login' : '#/register'}>{isRegister ? 'Log in' : 'Create an account'}</a></p>
        {isRegister && <p className="auth-switch">Want to teach? <a href="#/instructor-apply">Become an instructor</a></p>}
      </section>
    </main>
  )
}

function InstructorApplicationPage({ onSubmit, loading, error, user, token }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', profileImage: user?.profileImage || '', professionalTitle: '', biography: user?.bio || '',
    expertise: '', teachingExperience: '', qualifications: '', portfolioLinks: '',
    password: '', confirmPassword: '', termsAccepted: Boolean(user),
  })
  const [validationError, setValidationError] = useState('')
  const [existingApplication, setExistingApplication] = useState(null)
  const [applicationState, setApplicationState] = useState({ loading: Boolean(user), error: '' })
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  useEffect(() => {
    if (!user) {
      return undefined
    }

    let active = true
    apiRequest('/instructor-applications/me', { token })
      .then((result) => {
        if (active) setExistingApplication(result.data)
      })
      .catch((requestError) => {
        if (active && requestError.status !== 404) {
          setApplicationState({ loading: false, error: requestError.message })
          return
        }
      })
      .finally(() => {
        if (active) setApplicationState((current) => ({ ...current, loading: false }))
      })
    return () => { active = false }
  }, [token, user])

  async function submit(event) {
    event.preventDefault()
    setValidationError('')
    if (!user && (form.password.length < 8 || new TextEncoder().encode(form.password).length > 72)) {
      setValidationError('Password must be at least 8 characters and no more than 72 bytes.')
    } else if (!user && form.password !== form.confirmPassword) {
      setValidationError('Passwords do not match.')
    } else if (!form.termsAccepted) {
      setValidationError('Please agree to the terms and privacy policy.')
    } else if (form.biography.trim().length < 20) {
      setValidationError('Biography must be at least 20 characters.')
    } else {
      const list = (value) => value.split(',').map((item) => item.trim()).filter(Boolean)
      await onSubmit({
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        profileImage: form.profileImage.trim(),
        professionalTitle: form.professionalTitle.trim(),
        biography: form.biography.trim(),
        expertise: list(form.expertise),
        teachingExperience: form.teachingExperience.trim(),
        qualifications: list(form.qualifications),
        portfolioLinks: list(form.portfolioLinks),
      })
    }
  }

  return (
    <main className="page-main account-page">
      <section className="page-intro">
        <p className="eyebrow">TEACH WITH LEARNHUB</p>
        <h1>Share what<br /><span>you know.</span></h1>
        <p>Apply to teach. Your account stays a student account until an administrator approves your application.</p>
      </section>
      {applicationState.loading && <div className="state-card" role="status"><span className="spinner" /> Checking your application…</div>}
      {applicationState.error && <div className="form-alert" role="alert">{applicationState.error}</div>}
      {existingApplication ? (
        <section className="application-status-card">
          <span className="role-badge">INSTRUCTOR APPLICATION · {existingApplication.status}</span>
          <p>
            {existingApplication.status === 'PENDING'
              ? 'Administrator approval is required before instructor access is granted.'
              : existingApplication.status === 'APPROVED'
                ? 'Your application was approved. Your account now has instructor access.'
                : 'Your application was rejected. The current application policy does not allow resubmission; contact an administrator for assistance.'}
          </p>
          {existingApplication.reviewNote && <p><strong>Administrator note:</strong> {existingApplication.reviewNote}</p>}
        </section>
      ) : !applicationState.loading && !applicationState.error && (
      <form className="account-form section" onSubmit={submit}>
        {(validationError || error) && <div className="form-alert" role="alert">{validationError || error}</div>}
        <div className="account-form-grid">
          {!user && <>
            <label className="form-field">Full name<input value={form.name} onChange={(event) => setField('name', event.target.value)} required minLength={2} maxLength={80} /></label>
            <label className="form-field">Email<input type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} required /></label>
            <label className="form-field">Password<input type="password" value={form.password} onChange={(event) => setField('password', event.target.value)} required minLength={8} autoComplete="new-password" /></label>
            <label className="form-field">Confirm password<input type="password" value={form.confirmPassword} onChange={(event) => setField('confirmPassword', event.target.value)} required minLength={8} autoComplete="new-password" /></label>
          </>}
          <label className="form-field">Profile photo URL (optional)<input type="url" value={form.profileImage} onChange={(event) => setField('profileImage', event.target.value)} placeholder="https://…" /></label>
          <label className="form-field">Professional title<input value={form.professionalTitle} onChange={(event) => setField('professionalTitle', event.target.value)} required maxLength={120} placeholder="e.g. Web development instructor" /></label>
          <label className="form-field account-form-wide">Biography<textarea value={form.biography} onChange={(event) => setField('biography', event.target.value)} required minLength={20} maxLength={2000} rows={4} /></label>
          <label className="form-field">Areas of expertise<span className="form-hint">Separate items with commas.</span><input value={form.expertise} onChange={(event) => setField('expertise', event.target.value)} required placeholder="JavaScript, accessibility" /></label>
          <label className="form-field">Teaching experience<textarea value={form.teachingExperience} onChange={(event) => setField('teachingExperience', event.target.value)} required rows={3} /></label>
          <label className="form-field">Qualifications or certificates<span className="form-hint">Separate items with commas.</span><input value={form.qualifications} onChange={(event) => setField('qualifications', event.target.value)} required placeholder="Degree, certifications" /></label>
          <label className="form-field">Portfolio or professional links<span className="form-hint">Optional; comma-separated HTTPS links.</span><input value={form.portfolioLinks} onChange={(event) => setField('portfolioLinks', event.target.value)} placeholder="https://…" /></label>
        </div>
        <label className="check-field"><input type="checkbox" checked={form.termsAccepted} onChange={(event) => setField('termsAccepted', event.target.checked)} /> I agree to the terms and privacy policy.</label>
        <button className="button button-dark auth-submit" disabled={loading}>{loading ? 'Submitting…' : 'Submit instructor application'} <span aria-hidden="true">↗</span></button>
        {!user && <p className="auth-switch">Already registered? <a href="#/login">Log in</a></p>}
      </form>
      )}
    </main>
  )
}

function CourseDetail({ id, token, user }) {
  const [course, setCourse] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })
  const [enrollment, setEnrollment] = useState({
    loading: Boolean(token),
    enrolled: false,
    submitting: false,
    error: '',
    message: '',
  })
  const enrollmentLock = useRef(false)

  const loadCourse = useCallback(async () => {
    setState({ loading: true, error: '' })
    try {
      const result = await apiRequest(`/courses/${encodeURIComponent(id)}`)
      setCourse(result.data)
      setState({ loading: false, error: '' })
    } catch (error) {
      setState({ loading: false, error: error.message })
    }
  }, [id])

  const loadEnrollment = useCallback(async () => {
    if (!token) return
    try {
      const result = await apiRequest('/enrollments/my-courses', { token })
      if (!Array.isArray(result.data)) throw new Error('The server returned an invalid enrollment list.')
      setEnrollment({
        loading: false,
        enrolled: result.data.some((item) => String(courseId(item.course)) === String(id)),
        submitting: false,
        error: '',
        message: '',
      })
    } catch (error) {
      setEnrollment({ loading: false, enrolled: false, submitting: false, error: error.message, message: '' })
    }
  }, [id, token])

  async function retryEnrollment() {
    setEnrollment((current) => ({ ...current, loading: true, error: '' }))
    await loadEnrollment()
  }

  useEffect(() => {
    let active = true
    async function fetchCourse() {
      try {
        const result = await apiRequest(`/courses/${encodeURIComponent(id)}`)
        if (active) {
          setCourse(result.data)
          setState({ loading: false, error: '' })
        }
      } catch (error) {
        if (active) setState({ loading: false, error: error.message })
      }
    }
    fetchCourse()
    return () => { active = false }
  }, [id])

  useEffect(() => {
    Promise.resolve().then(loadEnrollment)
  }, [loadEnrollment])

  async function enroll() {
    if (!token || enrollmentLock.current) return
    enrollmentLock.current = true
    setEnrollment((current) => ({ ...current, submitting: true, error: '', message: '' }))
    try {
      const result = await apiRequest(`/enrollments/${encodeURIComponent(id)}`, {
        token,
        method: 'POST',
      })
      setEnrollment({ loading: false, enrolled: true, submitting: false, error: '', message: result.message || 'You are enrolled successfully.' })
    } catch (error) {
      if (error.status === 409) {
        setEnrollment({ loading: false, enrolled: true, submitting: false, error: '', message: 'Already Enrolled' })
      } else {
        setEnrollment((current) => ({ ...current, submitting: false, error: error.message }))
      }
    } finally {
      enrollmentLock.current = false
    }
  }

  return (
    <>
      <main className="page-main detail-main">
        {state.loading ? <div className="state-card" role="status"><span className="spinner" /> Loading course…</div> : state.error ? (
          <div className="state-card state-error" role="alert"><strong>Course unavailable</strong><span>{state.error}</span><button className="button button-outline" onClick={loadCourse}>Try again</button></div>
        ) : course ? (
          <article className="detail-card">
            <a className="back-link" href="#/courses">← All courses</a>
            <p className="eyebrow">LEARNHUB COURSE</p>
            <h1>{course.title}</h1>
            <p className="detail-price">{formatPrice(course.price)}</p>
            <p className="detail-description">{course.description}</p>
            <div className="detail-footer"><span>Learn at your own pace</span><span>Course · {course.slug}</span></div>
            <a className="button button-outline course-preview-link" href={`#/learn/${encodeURIComponent(id)}`}>Preview curriculum <span aria-hidden="true">↗</span></a>
            <div className="enrollment-actions">
              {!user ? (
                <p>Log in to enroll in this course. <a className="text-link" href="#/login">Log in <span aria-hidden="true">→</span></a></p>
              ) : enrollment.loading ? (
                <p className="enrollment-status" role="status"><span className="spinner" /> Checking your enrollment…</p>
              ) : enrollment.error ? (
                <div className="enrollment-feedback state-error" role="alert">
                  <span>{enrollment.error}</span>
                  <button className="button button-outline" onClick={retryEnrollment}>Try again</button>
                </div>
              ) : enrollment.enrolled ? (
                <div className="enrollment-feedback" role="status">
                  <strong>{enrollment.message || 'Already Enrolled'}</strong>
                  <a className="button button-dark" href={`#/learn/${encodeURIComponent(id)}`}>Continue Learning <span aria-hidden="true">↗</span></a>
                </div>
              ) : (
                <div className="enrollment-feedback">
                  {enrollment.message && <span role="status">{enrollment.message}</span>}
                  <button className="button button-dark" onClick={enroll} disabled={enrollment.submitting}>
                    {enrollment.submitting ? 'Enrolling…' : 'Enroll Now'} <span aria-hidden="true">↗</span>
                  </button>
                  {enrollment.error && <span className="form-alert" role="alert">{enrollment.error}</span>}
                </div>
              )}
            </div>
          </article>
        ) : null}
      </main>
    </>
  )
}

function MyCourses({ token }) {
  const [courses, setCourses] = useState([])
  const [progress, setProgress] = useState([])
  const [state, setState] = useState({ loading: true, error: '' })

  const loadEnrollments = useCallback(async () => {
    try {
      const [result, progressResult] = await Promise.all([
        apiRequest('/enrollments/my-courses', { token }),
        apiRequest('/curriculum/my-progress', { token }),
      ])
      if (!Array.isArray(result.data) || !Array.isArray(progressResult.data)) {
        throw new Error('The server returned invalid course progress.')
      }
      setCourses(result.data.map((enrollment) => enrollment.course).filter(Boolean))
      setProgress(progressResult.data)
      setState({ loading: false, error: '' })
    } catch (error) {
      setState({ loading: false, error: error.message })
    }
  }, [token])

  async function retryEnrollments() {
    setState({ loading: true, error: '' })
    await loadEnrollments()
  }

  useEffect(() => {
    Promise.resolve().then(loadEnrollments)
  }, [loadEnrollments])

  return (
    <main className="page-main my-courses-main">
      <section className="page-intro">
        <p className="eyebrow">YOUR LEARNING</p>
        <h1>My <span>courses.</span></h1>
        <p>Pick up where your curiosity left off and keep making progress.</p>
      </section>
      <section className="section catalog-section">
        <div className="catalog-toolbar">
          <div><h2>Enrolled courses</h2><p>Your learning, all in one place.</p></div>
          <a className="text-link" href="#/courses">Browse courses <span aria-hidden="true">→</span></a>
        </div>
        {state.loading ? <div className="state-card" role="status"><span className="spinner" /> Loading your courses…</div> : state.error ? (
          <div className="state-card state-error" role="alert"><strong>Could not load your courses</strong><span>{state.error}</span><button className="button button-outline" onClick={retryEnrollments}>Try again</button></div>
        ) : courses.length === 0 ? (
          <div className="state-card"><strong>You haven’t enrolled in a course yet</strong><span>Explore the catalog and find your next learning opportunity.</span><a className="button button-dark" href="#/courses">Browse courses</a></div>
        ) : (
          <div className="learning-course-cards">{progress.map((item) => (
            <article className="learning-course-card" key={item.courseId}>
              <div><p className="eyebrow">YOUR PROGRESS</p><h3>{item.course.title}</h3><p>{item.completedLessons} of {item.totalLessons} lessons completed</p></div>
              <progress value={item.percentage} max="100" aria-label={`${item.percentage}% course progress`} />
              <a className="button button-dark button-small" href={`#/learn/${encodeURIComponent(item.courseId)}${item.lastLessonId ? `/${encodeURIComponent(item.lastLessonId)}` : ''}`}>
                {item.lastLessonId ? 'Continue learning' : 'Start learning'} <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}</div>
        )}
      </section>
    </main>
  )
}

function StudentDashboard({ user, token, courses, refreshUser }) {
  const [dashboard, setDashboard] = useState(null)
  const [progress, setProgress] = useState([])
  const [application, setApplication] = useState(null)
  const [state, setState] = useState({ loading: true, error: '' })

  const load = useCallback(async () => {
    setState({ loading: true, error: '' })
    try {
      const [result, progressResult] = await Promise.all([
        apiRequest('/dashboards/student', { token }),
        apiRequest('/curriculum/my-progress', { token }),
      ])
      setDashboard(result.data)
      setProgress(progressResult.data)
      setState({ loading: false, error: '' })
    } catch (error) {
      setState({ loading: false, error: error.message })
    }
    try {
      const result = await apiRequest('/instructor-applications/me', { token })
      setApplication(result.data)
      if (result.data.status === 'APPROVED') await refreshUser()
    } catch (error) {
      if (error.status !== 404) setState((current) => ({ ...current, error: error.message }))
    }
  }, [refreshUser, token])

  useEffect(() => { Promise.resolve().then(load) }, [load])
  const enrolledCourses = (dashboard?.enrolledCourses || []).map((item) => item.course).filter(Boolean)

  return (
    <main className="page-main dashboard-main">
      <section className="dashboard-heading">
        <div><p className="eyebrow">STUDENT DASHBOARD</p><h1>Good to see you,<br /><span>{user.name.split(' ')[0]}.</span></h1><p>Pick up where you left off and keep your curiosity going.</p></div>
        <div className="dashboard-shortcuts"><a className="button button-outline" href="#/profile">Edit profile</a><a className="button button-dark" href="#/my-courses">My Courses</a></div>
      </section>
      {state.loading && <div className="state-card" role="status"><span className="spinner" /> Loading your learning…</div>}
      {state.error && <div className="form-alert" role="alert">{state.error}<button className="button button-outline button-small" onClick={load}>Try again</button></div>}
      {application && <div className="application-status-card">
        <span className="role-badge">INSTRUCTOR APPLICATION · {application.status}</span>
        <p>{application.status === 'PENDING' ? 'Administrator approval is required before instructor access is granted.' : application.status === 'REJECTED' ? 'Your application was rejected. The current application policy does not allow resubmission; contact an administrator for assistance.' : 'Your instructor access has been approved.'}</p>
        {application.reviewNote && <p><strong>Administrator note:</strong> {application.reviewNote}</p>}
      </div>}
      {dashboard && <>
        <section className="account-stat-grid student-stat-grid">
          <article className="account-stat"><span>Enrolled courses</span><strong>{dashboard.enrolledCount}</strong></article>
          <article className="account-stat"><span>Account role</span><strong>{user.role}</strong></article>
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar"><div><h2>Continue learning</h2><p>Pick up from your last lesson and keep making progress.</p></div><a className="text-link" href="#/my-courses">View all <span aria-hidden="true">→</span></a></div>
          {progress.length ? <div className="learning-course-cards">{progress.slice(0, 3).map((item) => (
            <article className="learning-course-card" key={item.courseId}>
              <div><p className="eyebrow">{item.percentage}% COMPLETE</p><h3>{item.course.title}</h3><p>{item.completedLessons} of {item.totalLessons} lessons completed</p></div>
              <progress value={item.percentage} max="100" aria-label={`${item.percentage}% course progress`} />
              <a className="button button-dark button-small" href={`#/learn/${encodeURIComponent(item.courseId)}${item.lastLessonId ? `/${encodeURIComponent(item.lastLessonId)}` : ''}`}>Continue learning ↗</a>
            </article>
          ))}</div> : <CourseCollection courses={enrolledCourses} loading={false} error="" onRetry={() => {}} emptyTitle="Your learning journey starts here" emptyMessage="Browse the catalog and enroll in a course to see it here." />}
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar"><div><h2>Explore something new</h2><p>Courses chosen for curious minds.</p></div><a className="text-link" href="#/courses">Full catalog <span aria-hidden="true">→</span></a></div>
          <CourseCollection courses={courses.slice(0, 3)} loading={false} error="" onRetry={() => {}} />
        </section>
      </>}
    </main>
  )
}

function InstructorApprovalNotice({ token }) {
  const [application, setApplication] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/instructor-applications/me', { token }).then((result) => {
      if (active) setApplication(result.data)
    }).catch((requestError) => {
      if (active && requestError.status !== 404) setError(requestError.message)
    })
    return () => { active = false }
  }, [token])

  return (
    <main className="page-main dashboard-main">
      <section className="dashboard-heading">
        <div><p className="eyebrow">INSTRUCTOR ACCESS REVIEW</p><h1>Access is<br /><span>pending.</span></h1><p>This account does not have administrator approval for instructor tools. Existing instructor accounts must be reviewed before creating or publishing courses.</p></div>
      </section>
      {error && <div className="form-alert" role="alert">{error}</div>}
      {application && <div className="application-status-card"><span className="role-badge">{application.status}</span><p>{application.status === 'PENDING' ? 'An administrator will review your application.' : 'The application is no longer pending. Contact an administrator if you need help.'}</p></div>}
      {!application && <section className="section dashboard-section"><div className="state-card"><strong>No instructor application found</strong><span>Submit your professional details to request instructor access.</span><a className="button button-dark" href="#/instructor-apply">Complete instructor application</a></div></section>}
    </main>
  )
}

function AccountPage({ user, token, onUserUpdate, onLogout, settings = false }) {
  const isApprovedInstructor = user.role === 'INSTRUCTOR' && Boolean(user.instructorApprovedAt)
  const [form, setForm] = useState(() => ({
    name: user.name || '',
    bio: user.bio || '',
    profileImage: user.profileImage || '',
    location: user.location || '',
    interests: (user.interests || []).join(', '),
    professionalTitle: user.professionalTitle || '',
    expertise: (user.expertise || []).join(', '),
    teachingExperience: user.teachingExperience || '',
    qualifications: (user.qualifications || []).join(', '),
    portfolioLinks: (user.portfolioLinks || []).join(', '),
  }))
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [state, setState] = useState({ saving: false, error: '', message: '' })
  const [passwordState, setPasswordState] = useState({ saving: false, error: '', message: '' })
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }))
  const list = (value) => value.split(',').map((item) => item.trim()).filter(Boolean)

  async function saveProfile(event) {
    event.preventDefault()
    setState({ saving: true, error: '', message: '' })
    try {
      const result = await apiRequest('/users/me', {
        token,
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          bio: form.bio,
          profileImage: form.profileImage.trim(),
          location: form.location,
          interests: list(form.interests),
          ...(isApprovedInstructor ? {
            professionalTitle: form.professionalTitle,
            expertise: list(form.expertise),
            teachingExperience: form.teachingExperience,
            qualifications: list(form.qualifications),
            portfolioLinks: list(form.portfolioLinks),
          } : {}),
        }),
      })
      onUserUpdate(result.data)
      setState({ saving: false, error: '', message: result.message })
    } catch (error) {
      setState({ saving: false, error: error.message, message: '' })
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setPasswordState({ saving: true, error: '', message: '' })
    try {
      const result = await apiRequest('/users/me/password', {
        token,
        method: 'PATCH',
        body: JSON.stringify(passwordForm),
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setPasswordState({ saving: false, error: '', message: result.message })
    } catch (error) {
      setPasswordState({ saving: false, error: error.message, message: '' })
    }
  }

  return (
    <main className="page-main account-page">
      <section className="page-intro">
        <p className="eyebrow">{settings ? 'ACCOUNT PREFERENCES' : `${user.role} PROFILE`}</p>
        <h1>{settings ? 'Your account.' : 'Your profile.'}</h1>
        <p>Manage the information connected to your LearnHub account.</p>
      </section>
      <section className="account-content">
        <form className="account-form" onSubmit={saveProfile}>
          <div className="account-profile-heading">
            <div className="profile-avatar">{user.profileImage ? <img src={user.profileImage} alt="" /> : user.name.slice(0, 1).toUpperCase()}</div>
            <div><span className="role-badge">{user.role}</span><p>Member since {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'date unavailable'}</p></div>
          </div>
          {(state.error || state.message) && <div className={state.error ? 'form-alert' : 'success-alert'} role={state.error ? 'alert' : 'status'}>{state.error || state.message}</div>}
          <div className="account-form-grid">
            <label className="form-field">Full name<input value={form.name} onChange={(event) => setField('name', event.target.value)} required minLength={2} maxLength={80} /></label>
            <label className="form-field">Email address<input value={user.email} readOnly /><span className="form-hint">{user.emailVerifiedAt ? 'Verified' : 'Email changes are unavailable until verification is supported.'}</span></label>
            <label className="form-field">Profile photo HTTPS URL<input type="url" value={form.profileImage} onChange={(event) => setField('profileImage', event.target.value)} placeholder="https://…" /></label>
            <label className="form-field">Location (optional)<input value={form.location} onChange={(event) => setField('location', event.target.value)} maxLength={120} /></label>
            <label className="form-field account-form-wide">Short biography<textarea value={form.bio} onChange={(event) => setField('bio', event.target.value)} maxLength={2000} rows={4} /></label>
            {user.role === 'STUDENT' && <label className="form-field account-form-wide">Learning interests<span className="form-hint">Separate items with commas.</span><input value={form.interests} onChange={(event) => setField('interests', event.target.value)} /></label>}
            {isApprovedInstructor && <>
              <label className="form-field">Professional title<input value={form.professionalTitle} onChange={(event) => setField('professionalTitle', event.target.value)} maxLength={120} /></label>
              <label className="form-field">Areas of expertise<span className="form-hint">Separate items with commas.</span><input value={form.expertise} onChange={(event) => setField('expertise', event.target.value)} /></label>
              <label className="form-field account-form-wide">Teaching experience<textarea value={form.teachingExperience} onChange={(event) => setField('teachingExperience', event.target.value)} rows={3} /></label>
              <label className="form-field">Qualifications<span className="form-hint">Separate items with commas.</span><input value={form.qualifications} onChange={(event) => setField('qualifications', event.target.value)} /></label>
              <label className="form-field">Portfolio links<span className="form-hint">Separate HTTPS links with commas.</span><input value={form.portfolioLinks} onChange={(event) => setField('portfolioLinks', event.target.value)} /></label>
            </>}
          </div>
          <button className="button button-dark" disabled={state.saving}>{state.saving ? 'Saving…' : 'Save profile'}</button>
        </form>
        {settings && <section className="account-form">
          <h2>Security</h2>
          <p className="auth-subtitle">Changing your password requires your current password.</p>
          {(passwordState.error || passwordState.message) && <div className={passwordState.error ? 'form-alert' : 'success-alert'} role={passwordState.error ? 'alert' : 'status'}>{passwordState.error || passwordState.message}</div>}
          <form onSubmit={changePassword}>
            <label className="form-field">Current password<input type="password" autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} required /></label>
            <label className="form-field">New password<input type="password" autoComplete="new-password" minLength={8} value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} required /></label>
            <label className="form-field">Confirm new password<input type="password" autoComplete="new-password" minLength={8} value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} required /></label>
            <button className="button button-dark" disabled={passwordState.saving}>{passwordState.saving ? 'Updating…' : 'Update password'}</button>
          </form>
          <div className="account-status-row"><span>Account status</span><strong>{user.accountStatus || 'ACTIVE'}</strong></div>
          <button className="button button-outline" onClick={onLogout}>Log out</button>
        </section>}
      </section>
    </main>
  )
}

function AdminDashboard({ user, token }) {
  const [dashboard, setDashboard] = useState(null)
  const [applications, setApplications] = useState([])
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [submittedSearch, setSubmittedSearch] = useState('')
  const [userRole, setUserRole] = useState('')
  const [page, setPage] = useState(1)
  const [applicationPage, setApplicationPage] = useState(1)
  const [applicationPages, setApplicationPages] = useState(1)
  const [coursePage, setCoursePage] = useState(1)
  const [coursePages, setCoursePages] = useState(1)
  const [moderationFilter, setModerationFilter] = useState('')
  const [state, setState] = useState({ loading: true, error: '', message: '' })

  const load = useCallback(async (userPage = page, userSearch = submittedSearch, roleFilter = userRole) => {
    setState({ loading: true, error: '', message: '' })
    try {
      const query = new URLSearchParams({
        page: String(userPage),
        limit: '10',
        ...(userSearch ? { search: userSearch } : {}),
        ...(roleFilter ? { role: roleFilter } : {}),
      })
      const courseQuery = new URLSearchParams({
        page: String(coursePage),
        limit: '10',
        ...(moderationFilter ? { published: moderationFilter } : {}),
      })
      const applicationQuery = new URLSearchParams({
        page: String(applicationPage),
        limit: '10',
        status: 'PENDING',
      })
      const [stats, pending, userList, moderationList] = await Promise.all([
        apiRequest('/admin/dashboard', { token }),
        apiRequest(`/admin/instructor-applications?${applicationQuery}`, { token }),
        apiRequest(`/admin/users?${query}`, { token }),
        apiRequest(`/admin/courses?${courseQuery}`, { token }),
      ])
      setDashboard({ ...stats.data, moderationCourses: moderationList.data })
      setApplications(pending.data)
      setApplicationPages(pending.pagination.pages)
      setUsers(userList.data)
      setCoursePages(moderationList.pagination.pages)
      setState({ loading: false, error: '', message: '' })
    } catch (error) {
      setState({ loading: false, error: error.message, message: '' })
    }
  }, [applicationPage, coursePage, moderationFilter, page, submittedSearch, token, userRole])

  useEffect(() => { Promise.resolve().then(() => load(page, submittedSearch)) }, [load, page, submittedSearch])

  async function review(application, status) {
    setState((current) => ({ ...current, error: '', message: '' }))
    try {
      const result = await apiRequest(`/admin/instructor-applications/${encodeURIComponent(application._id)}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await load()
      setState((current) => ({ ...current, message: result.message }))
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  async function updateAccountStatus(target) {
    const nextStatus = target.accountStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED'
    if (!window.confirm(`${nextStatus === 'DEACTIVATED' ? 'Deactivate' : 'Reactivate'} ${target.email}?`)) return
    try {
      await apiRequest(`/admin/users/${encodeURIComponent(target._id)}/status`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ accountStatus: nextStatus }),
      })
      await load()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  async function togglePublished(course) {
    try {
      await apiRequest(`/courses/${encodeURIComponent(courseId(course))}`, {
        token,
        method: 'PATCH',
        body: JSON.stringify({ published: !course.published }),
      })
      await load()
    } catch (error) {
      setState((current) => ({ ...current, error: error.message }))
    }
  }

  return (
    <main className="page-main dashboard-main">
      <section className="dashboard-heading">
        <div><p className="eyebrow">ADMINISTRATOR</p><h1>Platform<br /><span>overview.</span></h1><p>Review real account, course, and application activity.</p></div>
      </section>
      {state.loading && !dashboard && <div className="state-card" role="status"><span className="spinner" /> Loading administrator dashboard…</div>}
      {state.error && <div className="form-alert" role="alert">{state.error}<button className="button button-outline button-small" onClick={() => load()}>Try again</button></div>}
      {state.message && <div className="success-alert" role="status">{state.message}</div>}
      {dashboard && <>
        <section className="account-stat-grid" aria-label="Platform statistics">
          {[
            ['Students', dashboard.students],
            ['Instructors', dashboard.instructors],
            ['Applications pending', dashboard.pendingApplications],
            ['All courses', dashboard.totalCourses],
            ['Published', dashboard.publishedCourses],
            ['Unpublished', dashboard.unpublishedCourses],
          ].map(([label, value]) => <article className="account-stat" key={label}><span>{label}</span><strong>{value}</strong></article>)}
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar"><div><h2>Instructor applications</h2><p>Pending applicants remain students until approved.</p></div></div>
          {applications.length ? <div className="management-list">{applications.map((application) => (
            <article className="management-row" key={application._id}>
              <div className="management-copy">
                <span className="role-badge">{application.status}</span>
                <h3>{application.professionalTitle}</h3>
                <p>{application.user?.name} · {application.user?.email}</p>
                <p>{application.biography}</p>
                <p><strong>Expertise:</strong> {application.expertise.join(', ')}</p>
                <p><strong>Qualifications:</strong> {application.qualifications.join(', ')}</p>
                {application.portfolioLinks.map((link) => <a className="text-link" key={link} href={link} target="_blank" rel="noreferrer">{link}</a>)}
              </div>
              <div className="management-actions">
                <button className="button button-dark button-small" onClick={() => review(application, 'APPROVED')}>Approve</button>
                <button className="button button-danger button-small" onClick={() => review(application, 'REJECTED')}>Reject</button>
              </div>
            </article>
          ))}</div> : <div className="state-card"><strong>No pending applications</strong><span>New instructor applications will appear here.</span></div>}
          {applicationPages > 1 && <div className="form-actions pagination-actions">
            <button className="button button-outline" disabled={applicationPage <= 1} onClick={() => setApplicationPage((current) => current - 1)}>Previous applications</button>
            <span>Page {applicationPage} of {applicationPages}</span>
            <button className="button button-outline" disabled={applicationPage >= applicationPages} onClick={() => setApplicationPage((current) => current + 1)}>Next applications</button>
          </div>}
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar">
            <div><h2>{userRole === 'STUDENT' ? 'Manage Students' : userRole === 'INSTRUCTOR' ? 'Manage Instructors' : 'Manage Students and Instructors'}</h2><p>Role and account state are always enforced by the backend.</p></div>
            <form className="search-field" onSubmit={(event) => { event.preventDefault(); setPage(1); setSubmittedSearch(search) }}>
              <select value={userRole} onChange={(event) => { setPage(1); setUserRole(event.target.value) }} aria-label="Filter users by role">
                <option value="">All users</option><option value="STUDENT">Students</option><option value="INSTRUCTOR">Instructors</option>
              </select>
              <span aria-hidden="true">⌕</span><input aria-label="Search users" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users" />
              <button type="submit">Search</button>
            </form>
          </div>
          <div className="management-list">{users.map((target) => (
            <article className="management-row" key={target._id}>
              <div className="management-copy"><span className="role-badge">{target.role === 'INSTRUCTOR' && !target.instructorApprovedAt ? 'INSTRUCTOR · PENDING REVIEW' : `${target.role} · ${target.accountStatus || 'ACTIVE'}`}</span><h3>{target.name}</h3><p>{target.email}</p></div>
              <div className="management-actions">{target._id !== user.id && (target.role === 'ADMIN'
                ? <span className="role-badge">PROTECTED</span>
                : <button className="button button-outline button-small" onClick={() => updateAccountStatus(target)}>{target.accountStatus === 'DEACTIVATED' ? 'Reactivate' : 'Deactivate'}</button>)}</div>
            </article>
          ))}</div>
          <div className="form-actions">
            <button className="button button-outline" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <span>Page {page}</span>
            <button className="button button-outline" disabled={users.length < 10} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar">
            <div><h2>Course moderation</h2><p>Publish status changes use the same backend permissions as course editing.</p></div>
            <label className="search-field"><span className="sr-only">Filter courses</span>
              <select value={moderationFilter} onChange={(event) => { setCoursePage(1); setModerationFilter(event.target.value) }} aria-label="Filter courses by publishing status">
                <option value="">All courses</option><option value="true">Published</option><option value="false">Unpublished</option>
              </select>
            </label>
          </div>
          {dashboard && dashboard.moderationCourses?.length ? <div className="management-list">{dashboard.moderationCourses.map((course) => (
            <article className="management-row" key={courseId(course)}>
              <div className="management-copy"><span className="role-badge">{course.published ? 'PUBLISHED' : 'UNPUBLISHED'}</span><h3>{course.title}</h3><p>{course.description}</p><p>Instructor: {course.instructor?.name || 'Not assigned'}</p></div>
              <div className="management-actions"><a className="button button-dark button-small" href={`#/curriculum/${encodeURIComponent(courseId(course))}`}>Manage curriculum</a><button className="button button-outline button-small" onClick={() => togglePublished(course)}>{course.published ? 'Unpublish' : 'Publish'}</button></div>
            </article>
          ))}</div> : <div className="state-card"><strong>No courses found</strong><span>Try a different moderation filter.</span></div>}
          {coursePages > 1 && <div className="form-actions pagination-actions">
            <button className="button button-outline" disabled={coursePage <= 1} onClick={() => setCoursePage((current) => current - 1)}>Previous courses</button>
            <span>Page {coursePage} of {coursePages}</span>
            <button className="button button-outline" disabled={coursePage >= coursePages} onClick={() => setCoursePage((current) => current + 1)}>Next courses</button>
          </div>}
        </section>
        <section className="section dashboard-section">
          <div className="catalog-toolbar"><div><h2>Recent registrations</h2><p>Newest accounts from the database.</p></div></div>
          <div className="management-list">{dashboard.recentUsers.map((recent) => (
            <article className="management-row" key={recent._id}>
              <div className="management-copy"><h3>{recent.name}</h3><p>{recent.email} · {recent.role} · {new Date(recent.createdAt).toLocaleDateString()}</p></div>
            </article>
          ))}</div>
        </section>
      </>}
    </main>
  )
}

const emptyForm = { title: '', slug: '', description: '', price: '0', published: false }

function CourseForm({ initialCourse, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(initialCourse ? {
    title: initialCourse.title,
    slug: initialCourse.slug,
    description: initialCourse.description,
    price: String(initialCourse.price ?? 0),
    published: Boolean(initialCourse.published),
  } : emptyForm)
  const [validationError, setValidationError] = useState('')

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    const price = Number(form.price)
    if (!form.title.trim() || !form.slug.trim() || !form.description.trim()) {
      setValidationError('Title, slug, and description are required.')
      return
    }
    if (!Number.isFinite(price) || price < 0) {
      setValidationError('Price must be a non-negative number.')
      return
    }
    setValidationError('')
    await onSave({ title: form.title.trim(), slug: form.slug.trim().toLowerCase(), description: form.description.trim(), price, published: form.published })
  }

  return (
    <form className="management-form" onSubmit={submit}>
      <div className="form-heading"><div><p className="eyebrow">{initialCourse ? 'UPDATE YOUR COURSE' : 'ADD SOMETHING NEW'}</p><h2>{initialCourse ? 'Edit course' : 'Create a course'}</h2></div><button type="button" className="icon-button" aria-label="Close course form" onClick={onCancel}>×</button></div>
      {(validationError || error) && <div className="form-alert" role="alert">{validationError || error}</div>}
      <label className="form-field">Course title<input value={form.title} onChange={(event) => setField('title', event.target.value)} required /></label>
      <label className="form-field">Course slug<input value={form.slug} onChange={(event) => setField('slug', event.target.value)} required /><span className="form-hint">A unique, URL-friendly name.</span></label>
      <label className="form-field">Description<textarea value={form.description} onChange={(event) => setField('description', event.target.value)} required rows={4} /></label>
      <label className="form-field">Price (USD)<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => setField('price', event.target.value)} required /></label>
      <label className="check-field"><input type="checkbox" checked={form.published} onChange={(event) => setField('published', event.target.checked)} /> Make this course public</label>
      <div className="form-actions"><button className="button button-dark" type="submit" disabled={saving}>{saving ? 'Saving…' : initialCourse ? 'Save changes' : 'Create course'}</button><button className="button button-outline" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  )
}

function Dashboard({ user, token, courses, refreshCourses, rememberCourse, removeCourse, refreshUser }) {
  const [editing, setEditing] = useState(null)
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const [instructorStats, setInstructorStats] = useState(null)
  const [instructorState, setInstructorState] = useState({ loading: user.role === 'INSTRUCTOR', error: '' })
  const canManage = user.role === 'INSTRUCTOR' || user.role === 'ADMIN'
  const loadInstructorStats = useCallback(async () => {
    if (user.role !== 'INSTRUCTOR') return
    try {
      const result = await apiRequest('/dashboards/instructor', { token })
      setInstructorStats(result.data)
      setInstructorState({ loading: false, error: '' })
    } catch (error) {
      setInstructorState({ loading: false, error: error.message })
    }
  }, [token, user.role])

  useEffect(() => { Promise.resolve().then(loadInstructorStats) }, [loadInstructorStats])
  const managedCourses = useMemo(() => {
    if (user.role === 'INSTRUCTOR' && instructorStats) return instructorStats.courses
    const owned = user.role === 'ADMIN'
      ? courses
      : courses.filter((course) => String(instructorId(course) || '') === String(user.id))
    return owned
  }, [courses, instructorStats, user.id, user.role])

  async function saveCourse(data) {
    setSaving(true)
    setFormError('')
    setNotice('')
    try {
      const editingCourse = editing?.course
      const result = await apiRequest(editingCourse ? `/courses/${encodeURIComponent(courseId(editingCourse))}` : '/courses', {
        token,
        method: editingCourse ? 'PATCH' : 'POST',
        body: JSON.stringify(data),
      })
      rememberCourse(result.data)
      setEditing(null)
      setNotice(result.message || (editingCourse ? 'Course updated successfully.' : 'Course created successfully.'))
      refreshCourses()
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteCourse(course) {
    if (!window.confirm(`Delete “${course.title}”? This cannot be undone.`)) return
    setFormError('')
    setNotice('')
    try {
      const result = await apiRequest(`/courses/${encodeURIComponent(courseId(course))}`, { token, method: 'DELETE' })
      removeCourse(courseId(course))
      setNotice(result.message || 'Course deleted successfully.')
    } catch (error) {
      setFormError(error.message)
    }
  }

  if (user.role === 'STUDENT') {
    return <StudentDashboard user={user} token={token} courses={courses} refreshUser={refreshUser} />
  }

  if (user.role === 'INSTRUCTOR' && !user.instructorApprovedAt) {
    return <InstructorApprovalNotice token={token} />
  }

  if (user.role === 'ADMIN') {
    return <AdminDashboard user={user} token={token} />
  }

  return (
    <main className="page-main dashboard-main">
      <section className="dashboard-heading">
        <div><p className="eyebrow">{user.role} DASHBOARD</p><h1>Good to see you,<br /><span>{user.name.split(' ')[0]}.</span></h1><p>{canManage ? 'Keep your courses moving forward.' : 'Pick a course and keep your curiosity going.'}</p></div>
        {canManage && <button className="button button-dark" onClick={() => { setEditing({ course: null }); setFormError('') }}>＋ Create a course</button>}
      </section>
      {notice && <div className="success-alert" role="status">{notice}</div>}
      {formError && !editing && <div className="form-alert" role="alert">{formError}</div>}
      {user.role === 'INSTRUCTOR' && <>
        {instructorState.error && <div className="form-alert" role="alert">{instructorState.error}<button className="button button-outline button-small" onClick={loadInstructorStats}>Retry</button></div>}
        {instructorStats && <section className="account-stat-grid">
          <article className="account-stat"><span>Total courses</span><strong>{instructorStats.totalCourses}</strong></article>
          <article className="account-stat"><span>Published</span><strong>{instructorStats.publishedCourses}</strong></article>
          <article className="account-stat"><span>Drafts</span><strong>{instructorStats.draftCourses}</strong></article>
          <article className="account-stat"><span>Enrollments</span><strong>{instructorStats.enrolledStudents}</strong></article>
        </section>}
      </>}
      {canManage ? (
        <section className="section dashboard-section">
          <div className="catalog-toolbar"><div><h2>My Courses</h2><p>Manage your own courses and review current enrollment counts.</p></div><a className="text-link" href="#/profile">Edit instructor profile <span aria-hidden="true">→</span></a></div>
          {editing && <CourseForm initialCourse={editing.course} onSave={saveCourse} onCancel={() => setEditing(null)} saving={saving} error={formError} />}
          {instructorState.loading ? <div className="state-card" role="status"><span className="spinner" /> Loading course management…</div> : managedCourses.length === 0 ? <div className="state-card"><strong>No courses to manage yet</strong><span>Create your first course, or check back when one of your courses is published.</span></div> : (
            <div className="management-list">{managedCourses.map((course) => (
              <article className="management-row" key={courseId(course)}>
                <div className="management-copy"><div className="course-card-top"><span className="course-label">{course.published ? 'PUBLISHED' : 'DRAFT'}</span><span className="course-price">{formatPrice(course.price)}</span></div><h3>{course.title}</h3><p>{course.description}</p></div>
                <div className="management-actions"><a className="button button-dark button-small" href={`#/curriculum/${encodeURIComponent(courseId(course))}`}>Manage curriculum</a><button className="button button-outline button-small" onClick={() => { setEditing({ course }); setFormError('') }}>Edit</button><button className="button button-danger button-small" onClick={() => deleteCourse(course)}>Delete</button></div>
              </article>
            ))}</div>
          )}
        </section>
      ) : (
        <section className="section dashboard-section"><div className="catalog-toolbar"><div><h2>Explore courses</h2><p>Find a course that fits where you want to go.</p></div><a className="text-link" href="#/courses">Full catalog <span aria-hidden="true">→</span></a></div><CourseCollection courses={courses.slice(0, 3)} loading={false} error="" onRetry={() => {}} /></section>
      )}
      {user.role === 'INSTRUCTOR' && instructorStats && <section className="section dashboard-section">
        <div className="catalog-toolbar"><div><h2>Students</h2><p>Learners enrolled in your courses.</p></div></div>
        {instructorStats.students.length
          ? <div className="management-list">{instructorStats.students.map((enrollment) => (
            <article className="management-row" key={enrollment.id}>
              <div className="management-copy"><h3>{enrollment.user.name}</h3><p>{enrollment.user.email}</p></div>
              <div className="management-actions"><span className="role-badge">{enrollment.course.title}</span></div>
            </article>
          ))}</div>
          : <div className="state-card"><strong>No students enrolled yet</strong><span>Enrolled learners will appear here.</span></div>}
      </section>}
    </main>
  )
}

function Footer({ user }) {
  return (
    <footer className="site-footer">
      <div className="footer-main">
        <section className="footer-brand-column" aria-label="About LearnHub">
          <Brand />
          <p>Helping curious minds build valuable skills and move confidently toward what’s next.</p>
          <span className="footer-signoff"><span aria-hidden="true">✦</span> Learn. Build. Grow.</span>
        </section>
        <nav className="footer-column" aria-label="Explore">
          <h2>Explore</h2>
          <a href="#/courses">All courses</a>
          <a href="#/learning-paths">Learning Paths</a>
          <p className="footer-note">Browse the published course catalog. Topic categories aren’t provided by the current course data.</p>
        </nav>
        <nav className="footer-column" aria-label="Platform">
          <h2>Platform</h2>
          <a href="#/about">About us</a>
          <a href="#/contact">Contact</a>
        </nav>
        <nav className="footer-column" aria-label="Account">
          <h2>Account</h2>
          {user ? (
            getAccountNavigation(user).map((item) => <a key={item.label} href={item.href}>{item.label}</a>)
          ) : (
            <>
              <a href="#/login">Log in</a>
              <a href="#/register">Register</a>
            </>
          )}
        </nav>
      </div>
      <div className="footer-bottom">
        <span>© {APP_YEAR} LearnHub. All rights reserved.</span>
        <span className="footer-bottom-note">Built for the curious <span aria-hidden="true">✦</span></span>
      </div>
    </footer>
  )
}

function App() {
  const [route, setRoute] = useState(routeFromHash)
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(window.localStorage.getItem(TOKEN_KEY)))
  const [authError, setAuthError] = useState('')
  const [authSubmitting, setAuthSubmitting] = useState(false)
  const [courses, setCourses] = useState([])
  const [courseState, setCourseState] = useState({ loading: true, error: '' })
  const [sessionCourses, setSessionCourses] = useState([])
  const [courseSearch, setCourseSearch] = useState('')

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const fetchCourses = useCallback(async () => {
    const result = await apiRequest('/courses')
    if (!Array.isArray(result.data)) throw new Error('The server returned an invalid course list.')
    return result.data
  }, [])

  const loadCourses = useCallback(async () => {
    setCourseState({ loading: true, error: '' })
    try {
      setCourses(await fetchCourses())
      setCourseState({ loading: false, error: '' })
    } catch (error) {
      setCourseState({ loading: false, error: error.message })
    }
  }, [fetchCourses])

  useEffect(() => {
    let active = true
    fetchCourses().then((data) => {
      if (active) {
        setCourses(data)
        setCourseState({ loading: false, error: '' })
      }
    }).catch((error) => {
      if (active) setCourseState({ loading: false, error: error.message })
    })
    return () => { active = false }
  }, [fetchCourses])

  useEffect(() => {
    let active = true
    async function restoreSession() {
      if (!token) return
      try {
        const result = await apiRequest('/auth/me', { token })
        if (active) {
          setUser(result.data)
          setAuthError('')
        }
      } catch (error) {
        if (active) {
          if (error.status === 401 || error.status === 403) {
            window.localStorage.removeItem(TOKEN_KEY)
            setToken(null)
          } else {
            setAuthError(error.message)
          }
        }
      } finally {
        if (active) setAuthLoading(false)
      }
    }
    restoreSession()
    return () => { active = false }
  }, [token])

  const refreshUser = useCallback(async () => {
    if (!token) return
    const result = await apiRequest('/auth/me', { token })
    setUser(result.data)
  }, [token])

  async function authenticate(path, body) {
    setAuthSubmitting(true)
    setAuthError('')
    try {
      const result = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
      window.localStorage.setItem(TOKEN_KEY, result.token)
      setToken(result.token)
      setUser(result.data)
      setAuthError('')
      navigate(getDashboardPath(result.data))
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthSubmitting(false)
    }
  }

  async function submitInstructorApplication(body) {
    setAuthSubmitting(true)
    setAuthError('')
    try {
      if (user && token) {
        const result = await apiRequest('/instructor-applications/me', {
          token,
          method: 'POST',
          body: JSON.stringify(body),
        })
        setAuthError('')
        navigate('/dashboard')
        return result
      }
      const result = await apiRequest('/instructor-applications', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      window.localStorage.setItem(TOKEN_KEY, result.token)
      setToken(result.token)
      setUser(result.data)
      setAuthError('')
      navigate('/dashboard')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthSubmitting(false)
    }
  }

  function logout() {
    window.localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setSessionCourses([])
    setAuthError('')
    navigate('/')
  }

  function rememberCourse(course) {
    const id = courseId(course)
    setSessionCourses((current) => [course, ...current.filter((item) => courseId(item) !== id)])
    setCourses((current) => course.published
      ? [course, ...current.filter((item) => courseId(item) !== id)]
      : current.filter((item) => courseId(item) !== id))
  }

  function removeCourse(id) {
    setSessionCourses((current) => current.filter((item) => courseId(item) !== id))
    setCourses((current) => current.filter((item) => courseId(item) !== id))
  }

  const allCourses = useMemo(() => {
    const ids = new Set(courses.map(courseId))
    return [...sessionCourses.filter((course) => !ids.has(courseId(course))), ...courses]
  }, [courses, sessionCourses])

  const roleRoute = !authLoading ? resolveRoleRoute(route.page, user) : { page: route.page }
  const page = roleRoute.page
  const isLearningLessonPage = page === 'learning' && /^#\/learning-paths\/lessons\//.test(window.location.hash)
  if (roleRoute.redirect && window.location.hash !== `#${roleRoute.redirect}`) navigate(roleRoute.redirect)

  if (authLoading) return <div className="app-loading" role="status"><span className="spinner" /> Restoring your session…</div>

  return (
    <div className={`app-shell${isLearningLessonPage ? ' lesson-app-shell' : ''}`}>
      {!isLearningLessonPage && <Header
        user={user}
        onLogout={logout}
        page={page}
        searchValue={courseSearch}
        onSearch={setCourseSearch}
        onSearchSubmit={(value) => {
          setCourseSearch(value)
          if (page !== 'courses') navigate('/courses')
        }}
      />}
      {!isLearningLessonPage && authError && user && <div className="session-alert" role="status">{authError}</div>}
      {page === 'home' && <HomePage courses={allCourses} loading={courseState.loading} error={courseState.error} onRetry={loadCourses} />}
      {page === 'courses' && <CatalogPage courses={allCourses.filter((course) => course.published)} loading={courseState.loading} error={courseState.error} onRetry={loadCourses} search={courseSearch} onSearch={setCourseSearch} />}
      {page === 'about' && <AboutPage />}
      {page === 'contact' && <ContactPage />}
      {(page === 'login' || page === 'register') && <AuthPage mode={page} onSubmit={authenticate} error={authError} loading={authSubmitting} />}
      {page === 'instructor-apply' && <InstructorApplicationPage user={user} token={token} onSubmit={submitInstructorApplication} error={authError} loading={authSubmitting} />}
      {page === 'dashboard' && user && <Dashboard user={user} token={token} courses={allCourses} refreshCourses={loadCourses} rememberCourse={rememberCourse} removeCourse={removeCourse} refreshUser={refreshUser} />}
      {page === 'my-courses' && user && <MyCourses token={token} />}
      {page === 'profile' && user && <AccountPage user={user} token={token} onUserUpdate={setUser} onLogout={logout} />}
      {page === 'settings' && user && <AccountPage user={user} token={token} onUserUpdate={setUser} onLogout={logout} settings />}
      {page === 'admin' && user?.role === 'ADMIN' && <AdminDashboard user={user} token={token} />}
      {page === 'course' && <CourseDetail key={route.id} id={route.id} token={token} user={user} />}
      {page === 'curriculum' && user && <InstructorCourseBuilder key={route.courseId} courseId={route.courseId} token={token} />}
      {page === 'learn' && <StudentLearning key={`${route.courseId}:${route.lessonId}`} courseId={route.courseId} lessonId={route.lessonId} token={token} />}
      {page === 'learning' && <LearningPaths key={window.location.hash} token={token} user={user} />}
      {!['home', 'courses', 'about', 'contact', 'login', 'register', 'instructor-apply', 'dashboard', 'my-courses', 'profile', 'settings', 'admin', 'course', 'curriculum', 'learn', 'learning'].includes(page) && <main className="page-main"><div className="state-card"><strong>That page isn’t here.</strong><a className="text-link" href="#/">Back to home →</a></div></main>}
      {!isLearningLessonPage && <Footer user={user} />}
    </div>
  )
}

export default App
