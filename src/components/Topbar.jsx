import '../css/topbar.css';
import { useSidebar } from '../context/SidebarContext';
import { useEffect, useState } from 'react';

const Topbar = () => {
  const { toggleSidebar } = useSidebar();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    const initial = saved === 'dark' || saved === 'light' ? saved : 'light';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
  };

  return (
    <div className="navbar-header">
      <div className="row align-items-center justify-content-between">

        {/* Left side: toggle + search */}
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-4">
            <button type="button" className="sidebar-mobile-toggle" aria-label="Sidebar Mobile Toggler Button" onClick={toggleSidebar}>
              <iconify-icon icon="heroicons:bars-3-solid" className="icon"></iconify-icon>
            </button>
            <form className="navbar-search">
              <input type="text" className="bg-transparent" name="search" placeholder="Search" />
              <iconify-icon icon="ion:search-outline" className="icon"></iconify-icon>
            </form>
          </div>
        </div>

        {/* Right side: theme toggle, language, notifications */}
        <div className="col-auto">
          <div className="d-flex flex-wrap align-items-center gap-3">

            {/* Dark/Light mode toggle */}
            <button
              type="button"
              data-theme-toggle=""
              className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
              aria-label="Dark & Light Mode Button"
              onClick={toggleTheme}
            >
              <iconify-icon icon={theme === 'dark' ? 'ri:sun-line' : 'ri:moon-line'} className="text-primary-light text-xl"></iconify-icon>
            </button>

            {/* Language dropdown */}
            <div className="dropdown d-inline-block">
              <button
                className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-label="Language Change Button"
              >
                <img src="https://flagcdn.com/w40/us.png" alt="flag" className="w-24 h-24 object-fit-cover rounded-circle" />
              </button>
              <div className="dropdown-menu to-top dropdown-menu-sm">
                <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                  <h6 className="text-lg text-primary-light fw-semibold mb-0">Choose Your Language</h6>
                </div>
                <div className="max-h-400-px overflow-y-auto scroll-sm pe-8">
                  {[
                    { id: 'english', flag: 'https://flagcdn.com/w40/us.png', label: 'English' },
                    { id: 'japan',   flag: 'https://flagcdn.com/w40/jp.png', label: 'Japan' },
                    { id: 'france',  flag: 'https://flagcdn.com/w40/fr.png', label: 'France' },
                    { id: 'germany', flag: 'https://flagcdn.com/w40/de.png', label: 'Germany' },
                    { id: 'korea',   flag: 'https://flagcdn.com/w40/kr.png', label: 'South Korea' },
                    { id: 'bangladesh', flag: 'https://flagcdn.com/w40/bd.png', label: 'Bangladesh' },
                    { id: 'india',   flag: 'https://flagcdn.com/w40/in.png', label: 'India' },
                    { id: 'canada',  flag: 'https://flagcdn.com/w40/ca.png', label: 'Canada' },
                  ].map(({ id, flag, label }) => (
                    <div key={id} className="form-check style-check d-flex align-items-center justify-content-between mb-16">
                      <label className="form-check-label line-height-1 fw-medium text-secondary-light" htmlFor={id}>
                        <span className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                          <img
                            src={flag}
                            alt={label}
                            className="w-36-px h-36-px bg-success-subtle text-success-main rounded-circle flex-shrink-0"
                          />
                          <span className="text-md fw-semibold mb-0">{label}</span>
                        </span>
                      </label>
                      <input className="form-check-input" type="radio" name="language" id={id} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Notification dropdown */}
            <div className="dropdown">
              <button
                className="has-indicator w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center position-relative"
                type="button"
                data-bs-toggle="dropdown"
                aria-label="Notification Button"
              >
                <iconify-icon icon="iconoir:bell" className="text-primary-light text-xl"></iconify-icon>
                <span className="w-8-px h-8-px bg-danger-600 position-absolute end-0 top-0 rounded-circle mt-2 me-2"></span>
              </button>
              <div className="dropdown-menu to-top dropdown-menu-lg p-0">
                <div className="m-16 py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                  <h6 className="text-lg text-primary-light fw-semibold mb-0">Notifications</h6>
                  <span className="text-primary-600 fw-semibold text-lg w-40-px h-40-px rounded-circle bg-base d-flex justify-content-center align-items-center">05</span>
                </div>
                <div className="max-h-400-px overflow-y-auto scroll-sm pe-4">
                  <a href="#" className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between">
                    <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                      <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <iconify-icon icon="bitcoin-icons:verify-outline" className="icon text-xxl"></iconify-icon>
                      </span>
                      <div>
                        <h6 className="text-md fw-semibold mb-4">Congratulations</h6>
                        <p className="mb-0 text-sm text-secondary-light text-w-200-px">Your profile has been Verified.</p>
                      </div>
                    </div>
                    <span className="text-sm text-secondary-light flex-shrink-0">23 Mins ago</span>
                  </a>
                  <a href="#" className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between bg-neutral-50">
                    <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                      <span className="w-44-px h-44-px bg-success-subtle text-success-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <img src="/assets/images/notification/profile-1.png" alt="Ronald" />
                      </span>
                      <div>
                        <h6 className="text-md fw-semibold mb-4">Ronald Richards</h6>
                        <p className="mb-0 text-sm text-secondary-light text-w-200-px">You can stitch between artboards</p>
                      </div>
                    </div>
                    <span className="text-sm text-secondary-light flex-shrink-0">23 Mins ago</span>
                  </a>
                  <a href="#" className="px-24 py-12 d-flex align-items-start gap-3 mb-2 justify-content-between">
                    <div className="text-black hover-bg-transparent hover-text-primary d-flex align-items-center gap-3">
                      <span className="w-44-px h-44-px bg-info-subtle text-info-main rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">AM</span>
                      <div>
                        <h6 className="text-md fw-semibold mb-4">Arlene McCoy</h6>
                        <p className="mb-0 text-sm text-secondary-light text-w-200-px">Invite you to prototyping</p>
                      </div>
                    </div>
                    <span className="text-sm text-secondary-light flex-shrink-0">23 Mins ago</span>
                  </a>
                </div>
                <div className="text-center py-12 px-16">
                  <a href="#" className="text-primary-600 fw-semibold text-md hover-underline">See All Notifications</a>
                </div>
              </div>
            </div>

            {/* Profile dropdown */}
            <div className="dropdown">
              <button
                className="w-40-px h-40-px bg-neutral-200 rounded-circle d-flex justify-content-center align-items-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-label="Profile Menu"
              >
                <img
                  src="/assets/images/thumbs/leave-request-img2.png"
                  alt="User"
                  className="w-24 h-24 object-fit-cover rounded-circle"
                />
              </button>
              <ul className="dropdown-menu to-top dropdown-menu-sm dropdown-menu-end border p-12">
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                  >
                    <iconify-icon icon="ri:user-3-line"></iconify-icon> My Profile
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                  >
                    <iconify-icon icon="ri:settings-3-line"></iconify-icon> Settings
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="dropdown-item rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-2 py-6"
                  >
                    <iconify-icon icon="ri:shut-down-line"></iconify-icon> Logout
                  </a>
                </li>
              </ul>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Topbar;
