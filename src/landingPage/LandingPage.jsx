import { useEffect, useState } from 'react'
import './landingPage.scss'
import dashboardPreview from './images/dashboardPreview.png'
import dashboardPreviewLight from './images/dashboard-white.png'
import schoolLogo from './images/infitoolz-logo.png'
import schoolLogoLight from './images/logo-white.png'

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'Modules', href: '#modules' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

const featureCards = [
  { icon: 'ri-building-4-line', title: 'Multi-school Management', copy: 'Manage multiple campuses from one command center.' },
  { icon: 'ri-shield-check-line', title: 'Role-Based Access Control', copy: 'Control what each staff member can see and do.' },
  { icon: 'ri-group-line', title: 'Student & Teacher Management', copy: 'Keep admissions, teachers, and classes aligned.' },
  { icon: 'ri-timer-flash-line', title: 'Attendance Tracking', copy: 'Track daily attendance with clean, quick workflows.' },
  { icon: 'ri-receipt-line', title: 'Fee & Invoice Management', copy: 'Collect fees, generate invoices, and follow dues.' },
  { icon: 'ri-file-chart-line', title: 'Exam & Result Management', copy: 'See actionable insights across operations.' },
  { icon: 'ri-book-open-line', title: 'Live Class & Study Materials', copy: 'Handle classes, lessons, exams, and results.' },
  { icon: 'ri-message-3-line', title: 'Parent Communication', copy: 'Send updates through SMS, email, and notices.' },
]

const roleCards = [
  { role: 'Head Admin', icon: 'ri-building-4-line', items: ['Manage all schools', 'Global reports', 'User governance', 'Policy control'] },
  { role: 'School Admin', icon: 'ri-briefcase-4-line', items: ['Staff management', 'School setup', 'Admissions', 'Finance operations'] },
  { role: 'Teacher', icon: 'ri-user-star-line', items: ['Attendance', 'Homework', 'Lesson planning', 'Progress updates'] },
  { role: 'Student', icon: 'ri-graduation-cap-line', items: ['Timetable', 'Study materials', 'Assignments', 'Results'] },
  { role: 'Parent', icon: 'ri-parent-line', items: ['Child progress', 'Notifications', 'Fee status', 'Communication'] },
]

const roleFooters = ['Full Control', 'Manage Efficiently', 'Teach Smarter', 'Learn Better', 'Stay Informed']

const moduleCards = [
  { icon: 'ri-team-line', title: 'HRMS', copy: 'Manage employees, payroll, departments and staff operations efficiently.', footer: '15+ Features' },
  { icon: 'ri-calendar-check-line', title: 'Attendance', copy: 'Track student and staff attendance with real-time reports and analytics.', footer: 'Real-time Tracking' },
  { icon: 'ri-file-list-3-line', title: 'Accounts', copy: 'Manage fees, invoices, payroll, expenses and financial reports.', footer: 'Secure & Accurate' },
  { icon: 'ri-pencil-ruler-2-line', title: 'Exams', copy: 'Create exams, manage schedules, evaluate and publish results.', footer: 'Smart Evaluation' },
  { icon: 'ri-book-2-line', title: 'Library', copy: 'Manage books, inventory, members, issue/return and library reports.', footer: 'Digital Library' },
  { icon: 'ri-bus-2-line', title: 'Transport', copy: 'Manage routes, vehicles, drivers and transport operations in real time.', footer: 'Live Tracking' },
  { icon: 'ri-hotel-bed-line', title: 'Hostel', copy: 'Manage hostel rooms, students, fees and daily hostel operations.', footer: 'Room Management' },
  { icon: 'ri-store-2-line', title: 'Office', copy: 'Handle admissions, inquiries, visitors and daily front office activities.', footer: 'Smart Reception' },
  { icon: 'ri-settings-3-line', title: 'Settings', copy: 'Configure system settings, roles, permissions and customizations.', footer: 'Granular Control' },
]

const benefits = ['Fast setup', 'Secure access', 'Cloud ready', 'Mobile friendly', 'Flexible permissions', 'Real-time notifications']
const benefitIcons = [
  'shield-check-line',
  'cloud-line',
  'smartphone-line',
  'notification-3-line',
  'toggle-line',
  'alarm-warning-line',
]

const analyticsPoints = [
  {
    icon: 'ri-bar-chart-line',
    title: 'Data-Driven Decisions',
    copy: 'Get actionable insights in real time.',
  },
  {
    icon: 'ri-shield-check-line',
    title: 'Accurate & Reliable',
    copy: '100% accurate data with secure reporting.',
  },
  {
    icon: 'ri-time-line',
    title: 'Save Time & Effort',
    copy: 'Automated reports and smart analytics.',
  },
  {
    icon: 'ri-team-line',
    title: 'Role-Based Insights',
    copy: 'Customized dashboards for every role.',
  },
]

const analyticsTasks = [
  { icon: 'ri-user-follow-line', tone: 'violet', title: '32 Leaves', copy: 'Needs Approval' },
  { icon: 'ri-coin-line', tone: 'amber', title: '18 Fee Dues', copy: 'Awaiting Payment' },
  { icon: 'ri-calendar-check-line', tone: 'cyan', title: '7 Exam Schedules', copy: 'Upcoming Exams' },
]

const analyticsBarValues = [36, 52, 46, 67, 48, 78, 61, 86]
const studentGrowthBars = [28, 40, 52, 63, 74]

function LandingPage({ onOpenLogin }) {
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    if (typeof window === 'undefined') return false

    const storedTheme = window.localStorage.getItem('landing-theme')
    if (storedTheme === 'dark') return true
    if (storedTheme === 'light') return false

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    window.localStorage.setItem('landing-theme', isDarkTheme ? 'dark' : 'light')
  }, [isDarkTheme])

  const handleContactScroll = () => {
    document.getElementById('contact')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleCardMove = (event) => {
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    card.style.setProperty('--mouse-x', `${x}px`)
    card.style.setProperty('--mouse-y', `${y}px`)
  }

  const handleThemeToggle = () => {
    setIsDarkTheme((current) => !current)
  }

  const brandLogo = isDarkTheme ? schoolLogo : schoolLogoLight

  return (
    <div className={`landing-page ${isDarkTheme ? 'is-dark' : 'is-light'}`} id="home">
      <header className="landing-page__header " >
        
        <div className="landing-page__brand">
          <img src={brandLogo} alt="" className="landing-page__brand-mark" />
          
        </div>

        <nav className="landing-page__nav" aria-label="Primary">
          {navLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-page__actions">
         
          <button
            type="button"
            className="landing-page__outline landing-page__theme-toggle"
            onClick={handleThemeToggle}
            aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            aria-pressed={isDarkTheme}
          >
            <i className={isDarkTheme ? 'ri-sun-line' : 'ri-moon-line'} aria-hidden="true" />
            
          </button>
          <button type="button" className="landing-page__ghost" onClick={onOpenLogin}>
            <i className="ri-user-3-line" aria-hidden="true" />
            Login
          </button>
          <button type="button" className="landing-page__primary" onClick={onOpenLogin}>
            Get Started
            <i className="ri-arrow-right-line" aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className='main'>
        <section className="landing-hero ">
          <div className="landing-hero__copy">
            <span className="landing-kicker">All-in-One School Management Solution</span>
            <h1>Smart School Management System</h1>
            <p>
              Manage schools, students, teachers, attendance, fees, exams, and communication from
              one powerful platform.
            </p>

            <div className="landing-hero__cta">
              <button
                type="button"
                className="landing-page__primary landing-page__primary--large"
                onClick={onOpenLogin}
              >
                Get Started
                <i className="ri-arrow-right-line" aria-hidden="true" />
              </button>
              <a className="landing-page__secondary" href="#features">
                View Features
                <i className="ri-play-circle-line" aria-hidden="true" />
              </a>
            </div>

            <div className="landing-hero__trust">
              <span>
                <i className="ri-shield-check-line" aria-hidden="true" />
                Secure & Reliable
              </span>
              <span>
                <i className="ri-flashlight-line" aria-hidden="true" />
                Easy to Use
              </span>
              <span>
                <i className="ri-cloud-line" aria-hidden="true" />
                Cloud Ready
              </span>
            </div>
          </div>

          <div className="landing-hero__visual" aria-hidden="true">
            <img
              src={isDarkTheme ? dashboardPreview : dashboardPreviewLight}
              alt=""
              className="landing-hero__preview-image"
            />
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-section__head landing-section__head--features">
            <span className="landing-kicker">Powerful Features</span>
            <h3 >
              Everything you need to run your educational institution smoothly.
            </h3>
          </div>

          <div className="landing-grid landing-grid--features">
            {featureCards.map((card) => (
              <article className="landing-card" key={card.title} onMouseMove={handleCardMove}>
                <span className="landing-card__icon">
                  <i className={card.icon} aria-hidden="true" />
                </span>
                <h4>{card.title}</h4>
                <p>{card.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-section--analytics" id="pricing">
          <div className="landing-analytics__intro">
            <span className="landing-kicker">Analytics & Insights</span>
            <h3>
              Real-Time School Analytics &
              <br />
              Smart Reports
            </h3>
            <p>
              Track attendance, fees, admissions, exams, staff activity, and school performance
              from one intelligent reporting center.
            </p>

            <div className="landing-analytics__points">
              {analyticsPoints.map((point) => (
                <div className="landing-analytics__point" key={point.title}>
                  <div className="landing-analytics__point-icon">
                    <i className={point.icon} aria-hidden="true" />
                  </div>
                  <div>
                    <strong>{point.title}</strong>
                    <span>{point.copy}</span>
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="landing-page__primary landing-page__primary--large" onClick={onOpenLogin}>
              Explore All Reports
              <i className="ri-arrow-right-line" aria-hidden="true" />
            </button>
          </div>

          <div className="landing-analytics">
            <div className="landing-analytics__cards landing-analytics__cards--top">
              <article className="landing-analytics__card landing-analytics__card--ring" onMouseMove={handleCardMove}>
                <div className="landing-analytics__card-head">
                  <div className="landing-analytics__card-title">
                    <span className="landing-analytics__badge landing-analytics__badge--violet">
                      <i className="ri-user-settings-line" aria-hidden="true" />
                    </span>
                    <strong>Attendance Rate</strong>
                  </div>
                  <i className="ri-more-2-fill" aria-hidden="true" />
                </div>
                <div className="landing-analytics__donut" aria-hidden="true">
                  <span>87%</span>
                </div>
                <div className="landing-analytics__card-foot">
                  <span>Monthly Growth</span>
                  <strong>+4.5%</strong>
                </div>
              </article>

              <article className="landing-analytics__card landing-analytics__card--line" onMouseMove={handleCardMove}>
                <div className="landing-analytics__card-head">
                  <div className="landing-analytics__card-title">
                    <span className="landing-analytics__badge landing-analytics__badge--green">
                      <i className="ri-wallet-3-line" aria-hidden="true" />
                    </span>
                    <strong>Fees Collected</strong>
                  </div>
                  <i className="ri-more-2-fill" aria-hidden="true" />
                </div>
                <div className="landing-analytics__amount">₹8,45,231</div>
                <div className="landing-analytics__subcopy">
                  <span>This Month</span>
                  <strong>↑ 18%</strong>
                </div>
                <div className="landing-analytics__line" aria-hidden="true">
                  <svg viewBox="0 0 320 140" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="feesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(34, 197, 94, 0.55)" />
                        <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
                      </linearGradient>
                      <linearGradient id="feesStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#22d3ee" />
                        <stop offset="55%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#22c55e" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0 112 C 24 94, 38 68, 58 82 C 80 96, 92 118, 108 90 C 124 62, 140 42, 160 54 C 178 64, 190 88, 208 76 C 228 62, 242 28, 258 38 C 274 48, 286 58, 302 46 C 310 40, 316 28, 320 18"
                      fill="none"
                      stroke="url(#feesStroke)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M 0 112 C 24 94, 38 68, 58 82 C 80 96, 92 118, 108 90 C 124 62, 140 42, 160 54 C 178 64, 190 88, 208 76 C 228 62, 242 28, 258 38 C 274 48, 286 58, 302 46 C 310 40, 316 28, 320 18 L 320 140 L 0 140 Z"
                      fill="url(#feesFill)"
                    />
                    <circle cx="320" cy="18" r="4.5" fill="#4ade80" />
                  </svg>
                  <div className="landing-analytics__axis">
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
              </article>
            </div>

            <div className="landing-analytics__cards landing-analytics__cards--bottom">
              <article className="landing-analytics__card landing-analytics__card--growth" onMouseMove={handleCardMove}>
                <div className="landing-analytics__card-head">
                  <div className="landing-analytics__card-title">
                    <span className="landing-analytics__badge landing-analytics__badge--blue">
                      <i className="ri-graduation-cap-line" aria-hidden="true" />
                    </span>
                    <strong>Student Growth</strong>
                  </div>
                  <i className="ri-more-2-fill" aria-hidden="true" />
                </div>
                <div className="landing-analytics__growth-value">
                  <strong>2,498</strong>
                  <span>Students</span>
                </div>
                <div className="landing-analytics__subcopy landing-analytics__subcopy--growth">
                  <strong>↑ 120 new admissions</strong>
                </div>
                <div className="landing-analytics__bars" aria-hidden="true">
                  {studentGrowthBars.map((height, index) => (
                    <span key={index} style={{ '--bar-height': `${height}%` }} />
                  ))}
                </div>
                <div className="landing-analytics__axis landing-analytics__axis--bars">
                  {['Jan', 'Feb', 'Mar', 'May', 'Jun'].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </article>

              <article className="landing-analytics__card landing-analytics__card--tasks" onMouseMove={handleCardMove}>
                <div className="landing-analytics__card-head">
                  <div className="landing-analytics__card-title">
                    <span className="landing-analytics__badge landing-analytics__badge--amber">
                      <i className="ri-notification-3-line" aria-hidden="true" />
                    </span>
                    <strong>Pending Tasks</strong>
                  </div>
                  <i className="ri-more-2-fill" aria-hidden="true" />
                </div>

                <div className="landing-analytics__tasks">
                  {analyticsTasks.map((task) => (
                    <div className="landing-analytics__task" key={task.title}>
                      <span className={`landing-analytics__task-icon is-${task.tone}`}>
                        <i className={task.icon} aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{task.title}</strong>
                        <span>{task.copy}</span>
                      </div>
                      <i className="ri-arrow-right-s-line" aria-hidden="true" />
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="landing-analytics__footer">
              <div className="landing-analytics__footer-note">
                <i className="ri-sparkling-2-line" aria-hidden="true" />
                <span>All your important data, beautifully organized and instantly accessible.</span>
              </div>
              <div className="landing-analytics__footer-tags">
                {['Real-time updates', 'Secure', 'Smart', 'Reliable'].map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--roles" id="about">
          <div className="landing-section__hero landing-section__hero--roles">
            <div className="landing-section__head landing-section__head--roles">
              <span className="landing-kicker">Built for Everyone</span>
              <h3>
                Customized dashboards and features                for every role.
              </h3>
              <p>
                Powerful tools tailored to the unique needs of administrators, teachers, students,
                and parents.
              </p>
            </div>

            <aside className="landing-section__callout" aria-hidden="true">
              <div className="landing-section__callout-icon">
                <i className="ri-user-settings-line" />
              </div>
              <div>
                <strong>Role-Based Access</strong>
                <span>Secure, customized, and simplified for your workflow.</span>
              </div>
            </aside>
          </div>

          <div className="landing-grid landing-grid--roles">
            {roleCards.map((card, index) => (
              <article className="landing-role" key={card.role} onMouseMove={handleCardMove}>
                <div className="landing-role__icon">
                  <i className={card.icon} aria-hidden="true" />
                </div>
                <h4>{card.role}</h4>
                <ul>
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <div className="landing-role__footer">
                  <span>{roleFooters[index]}</span>
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>

          <div className="landing-benefits landing-benefits--roles">
            {benefits.map((benefit, index) => (
              <div className="landing-benefits__item" key={benefit} onMouseMove={handleCardMove}>
                <i className={`ri-${benefitIcons[index]}`} aria-hidden="true" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-section" id="modules">
          <div className="landing-section__head landing-section__head--center landing-section__head--modules">
            <span className="landing-kicker">All-in-One Modules</span>
            <h3>
              A complete suite of modules to manage
            <br />
              every aspect of your institution.
            </h3>
            <p>Powerful, integrated and easy-to-use modules that help your school run smarter and faster.</p>
          </div>

          <div className="landing-modules">
            {moduleCards.map((moduleCard) => (
              <article className="landing-module" key={moduleCard.title} onMouseMove={handleCardMove}>
                <span className="landing-module__icon">
                  <i className={moduleCard.icon} aria-hidden="true" />
                </span>
                <h4>{moduleCard.title}</h4>
                <p>{moduleCard.copy}</p>
                <div className="landing-module__footer">
                  <span>{moduleCard.footer}</span>
                  <i className="ri-arrow-right-line" aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </section>

      </main>

      <footer className="landing-footer" id="contact">
        <div className="landing-footer__brand">
          <div className="landing-page__brand landing-page__brand--footer">
            <img src={brandLogo} alt="" className="landing-page__brand-mark" />
            
          </div>
          <p>Founded in 2016 by four passionate tech enthusiasts, TechieKit Solutions was built on the belief that technology should be as dependable and accessible as a toolkit.</p>
        </div>

        <div className="landing-footer__cols">
          <div>
            <h4>Links</h4>
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#modules">Modules</a>
            <a href="#about">About</a>
          </div>
          <div>
            <h4>Support</h4>
            <a href="#contact">Documentation</a>
            <a href="#contact">Help Center</a>
            <a href="#contact">Privacy Policy</a>
          </div>
          <div>
            <h4>Contact Us</h4>
            <span>Nagananda Commercial Complex, No.07/3, Second Floor, 15/1, 185/2, 185/A, 18th Main Road, Jayanagar 9th Block, Bengaluru - 560041</span>
            <span>+91 7996 101112</span>
            <span>info@techiekit.com</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
