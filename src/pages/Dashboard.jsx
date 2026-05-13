import {
  BarChart,
  DonutChart,
  StepAreaChart,
} from "../components/SimpleCharts";
import MiniCalendar from "../components/MiniCalendar";
import ProgressRing from "../components/ProgressRing";

const Dashboard = () => {
  return (
    <>
      <div className="dashboard-main-body">
        {/*
          Charts in the original HTML template were rendered by ApexCharts + jQuery scripts.
          Here we render lightweight SVG charts so the dashboard works without those scripts.
        */}

        <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
          <div className="">
            <h6 className="fw-semibold mb-0">Dashboard</h6>
            <p className="text-neutral-600 mt-4 mb-0">
              School - Manage your school, track attendance, expense, and net
              worth.
            </p>
          </div>
        </div>

        <div className="mt-24">
          <div className="row gy-4">
            <div className="col-xxl-8">
              <div className="row gy-4">
                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-1 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-warning-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/student-icon.png"
                            alt="Students"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Total Students
                        </p>
                      </div>

                      <h6 className="mb-0">20,000</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          10%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +520 This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-2 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-blue-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/teacher-icon.png"
                            alt="Teachers"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Total Teachers
                        </p>
                      </div>

                      <h6 className="mb-0">850</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          4%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +18 This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-3 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-purple-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/guardian-icon.png"
                            alt="Parents"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Total Parents
                        </p>
                      </div>

                      <h6 className="mb-0">12,400</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          7%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +140 This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-4 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-primary-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/fees-icon1.png"
                            alt="Fees"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Fees Collected
                        </p>
                      </div>

                      <h6 className="mb-0">$320,000</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          12%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +$28k This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-5 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-success-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/attendence-icon1.png"
                            alt="Attendance"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Avg Attendance
                        </p>
                      </div>

                      <h6 className="mb-0">87%</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          2%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +1.5% This Month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4 col-sm-6">
                  <div className="card shadow-1 radius-8 gradient-bg-end-6 h-100">
                    <div className="card-body p-20">
                      <div className="d-flex flex-wrap align-items-center gap-3 mb-16">
                        <div className="w-44-px h-44-px bg-cyan-600 rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/library-icon.png"
                            alt="Library"
                          />
                        </div>

                        <p className="fw-medium text-primary-light mb-1">
                          Library Books
                        </p>
                      </div>

                      <h6 className="mb-0">18,000</h6>

                      <p className="fw-medium text-sm text-primary-light mt-12 mb-0 d-flex align-items-center gap-2">
                        <span className="d-inline-flex align-items-center gap-1 text-primary-600 text-sm fw-semibold">
                          3%
                          <iconify-icon
                            icon="bxs:up-arrow"
                            className="text-xs"
                          ></iconify-icon>
                        </span>
                        +320 This Month
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-4">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <h6 className="text-lg mb-0">Student Attendance</h6>
                  </div>

                  <div className="p-20">
                    <div className="d-flex gap-6">
                      <div
                        className="h-44-px bg-primary-600 rounded"
                        style={{ width: "87%" }}
                      ></div>

                      <div
                        className="h-44-px bg-warning-600 rounded"
                        style={{ width: "40%" }}
                      ></div>

                      <div
                        className="h-44-px bg-purple-600 rounded"
                        style={{ width: "20%" }}
                      ></div>

                      <div
                        className="h-44-px bg-success-600 rounded"
                        style={{ width: "20%" }}
                      ></div>
                    </div>

                    <div className="mt-32 d-flex flex-column gap-24">
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="w-12-px h-12-px radius-2 bg-primary-600"></span>

                          <span className="text-neutral-600">Present </span>
                        </div>

                        <span className="fw-semibold text-primary-light">
                          87%
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="w-12-px h-12-px radius-2 bg-warning-600"></span>

                          <span className="text-neutral-600">Absent: </span>
                        </div>

                        <span className="fw-semibold text-primary-light">
                          40%
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="w-12-px h-12-px radius-2 bg-purple-600"></span>

                          <span className="text-neutral-600">Late </span>
                        </div>

                        <span className="fw-semibold text-primary-light">
                          20%
                        </span>
                      </div>

                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-2">
                          <span className="w-12-px h-12-px radius-2 bg-success-600"></span>

                          <span className="text-neutral-600">Half day </span>
                        </div>

                        <span className="fw-semibold text-primary-light">
                          20%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12">
              <div className="row gy-4">
                <div className="col-xxl-8">
                  <div className="row gy-4">
                    <div className="col-12">
                      <div className="card h-100">
                        <div className="card-body p-0">
                          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                            <div className="d-flex align-items-center gap-10">
                              <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                                <img
                                  src="/assets/images/icons/price-icon1.png"
                                  alt="Revenue"
                                  className="w-20-px h-20-px"
                                />
                              </span>
                              <h6 className="text-lg mb-0">
                                Revenue Statistic
                              </h6>
                            </div>
                          </div>

                          <div className="p-20">
                            <ul className="d-flex flex-wrap align-items-center justify-content-center mb-16 gap-3">
                              <li className="d-flex align-items-center gap-8">
                                <span
                                  className="w-12-px h-12-px radius-2 rotate-45-deg"
                                  style={{ background: "#25A194" }}
                                ></span>
                                <span className="text-secondary-light text-sm fw-semibold">
                                  Total Fee:{" "}
                                  <span className="text-primary-light fw-bold">
                                    $500
                                  </span>
                                </span>
                              </li>
                              <li className="d-flex align-items-center gap-8">
                                <span
                                  className="w-12-px h-12-px radius-2 rotate-45-deg"
                                  style={{ background: "#FF7A2C" }}
                                ></span>
                                <span className="text-secondary-light text-sm fw-semibold">
                                  Collected Fee:{" "}
                                  <span className="text-primary-light fw-bold">
                                    $300
                                  </span>
                                </span>
                              </li>
                            </ul>

                            <div className="w-100">
                              {/* Bar chart: total fee vs collected fee */}
                              {(() => {
                                const labels = [
                                  "Jan",
                                  "Feb",
                                  "Mar",
                                  "Apr",
                                  "May",
                                  "Jun",
                                  "Jul",
                                  "Aug",
                                  "Sep",
                                  "Oct",
                                  "Nov",
                                  "Dec",
                                ];
                                return (
                                  <div className="w-100">
                                    {/*
                                      Note: colors match the theme utility classes above.
                                    */}
                                    <BarChart
                                      labels={labels}
                                      series={[
                                        {
                                          name: "Total Fee",
                                          color: "#25A194",
                                          data: [
                                            25, 35, 50, 60, 26, 20, 40, 20, 50,
                                            16, 10, 40,
                                          ],
                                        },
                                        {
                                          name: "Collected Fee",
                                          color: "#FF7A2C",
                                          data: [
                                            15, 16, 22, 28, 14, 15, 20, 10, 25,
                                            10, 6, 20,
                                          ],
                                        },
                                      ]}
                                      height={260}
                                      stacked
                                      showValueLabels
                                      tooltip
                                      valueLabelFormatter={(v) => String(v)}
                                      valueFormatter={(v) => `$${v}k`}
                                      yLabelFormatter={(v) => `$${v}k`}
                                    />
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body p-0">
                          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                            <h6 className="text-lg mb-0">Notice Board</h6>

                            <div className="dropdown">
                              <button
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <iconify-icon
                                  icon="entypo:dots-three-vertical"
                                  className="icon text-secondary-light"
                                ></iconify-icon>
                              </button>

                              <ul className="dropdown-menu p-12 border bg-base shadow">
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalView"
                                  >
                                    <iconify-icon
                                      icon="hugeicons:view"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    View
                                  </button>
                                </li>

                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalEdit"
                                  >
                                    <iconify-icon
                                      icon="lucide:edit"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    Edit
                                  </button>
                                </li>

                                <li>
                                  <button
                                    type="button"
                                    className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalDelete"
                                  >
                                    <iconify-icon
                                      icon="fluent:delete-24-regular"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="ps-20 pt-20 pb-20">
                            <div className="pe-20 d-flex flex-column gap-20 max-h-462-px overflow-y-auto scroll-sm">
                              <div className="d-flex align-items-start gap-16">
                                <img
                                  src="/assets/images/thumbs/notice-board-img1.png"
                                  alt="Thumbnail"
                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                />

                                <div className="">
                                  <h6 className="mb-4 text-lg">Admin</h6>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Lorem Ipsum is simply dummy text of the
                                    printing and typesetti
                                  </p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">
                                    25 Jan 2024
                                  </span>
                                </div>
                              </div>

                              <div className="d-flex align-items-start gap-16">
                                <img
                                  src="/assets/images/thumbs/notice-board-img2.png"
                                  alt="Thumbnail"
                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                />

                                <div className="">
                                  <h6 className="mb-4 text-lg">
                                    Kathryn Murphy
                                  </h6>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Lorem Ipsum is simply dummy text of the
                                    printing and typesett ing industry Lorem
                                    Ipsum is simply dummy text of the printing
                                    and typesetting industry.
                                  </p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">
                                    25 Jan 2024
                                  </span>
                                </div>
                              </div>

                              <div className="d-flex align-items-start gap-16">
                                <img
                                  src="/assets/images/thumbs/notice-board-img3.png"
                                  alt="Thumbnail"
                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                />

                                <div className="">
                                  <h6 className="mb-4 text-lg">Admin</h6>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Lorem Ipsum is simply dummy text of the
                                    printing and typesetti
                                  </p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">
                                    25 Jan 2024
                                  </span>
                                </div>
                              </div>

                              <div className="d-flex align-items-start gap-16">
                                <img
                                  src="/assets/images/thumbs/notice-board-img2.png"
                                  alt="Thumbnail"
                                  className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                />

                                <div className="">
                                  <h6 className="mb-4 text-lg">John Doe</h6>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Lorem ipsum dolor sit amet consectetur
                                    adipisicing elit. Laborum voluptas corporis
                                    qui dolore est odit officia fuga?
                                  </p>

                                  <span className="text-secondary-light text-sm mb-0 mt-4">
                                    25 Jan 2024
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-md-6">
                      <div className="card h-100">
                        <div className="card-body p-0">
                          <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                            <h6 className="text-lg mb-0">Leave Requests</h6>

                            <div className="dropdown">
                              <button
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <iconify-icon
                                  icon="entypo:dots-three-vertical"
                                  className="icon text-secondary-light"
                                ></iconify-icon>
                              </button>

                              <ul className="dropdown-menu p-12 border bg-base shadow">
                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalView"
                                  >
                                    <iconify-icon
                                      icon="hugeicons:view"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    View
                                  </button>
                                </li>

                                <li>
                                  <button
                                    type="button"
                                    className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalEdit"
                                  >
                                    <iconify-icon
                                      icon="lucide:edit"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    Edit
                                  </button>
                                </li>

                                <li>
                                  <button
                                    type="button"
                                    className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                                    data-bs-toggle="modal"
                                    data-bs-target="#exampleModalDelete"
                                  >
                                    <iconify-icon
                                      icon="fluent:delete-24-regular"
                                      className="icon text-lg line-height-1"
                                    ></iconify-icon>
                                    Delete
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </div>

                          <div className="ps-20 pt-20 pb-20">
                            <div className="pe-20 d-flex flex-column gap-28 max-h-462-px overflow-y-auto scroll-sm">
                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img1.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Darlene Robertson
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img2.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Esther Howard
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img3.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Kristin Watson
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img4.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Leslie Alexander
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img5.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Dianne Russell
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>

                              <div className="d-flex align-items-center justify-content-between gap-16">
                                <div className="d-flex align-items-start gap-16">
                                  <img
                                    src="/assets/images/thumbs/leave-request-img3.png"
                                    alt="Thumbnail"
                                    className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                                  />

                                  <div className="">
                                    <h6 className="mb-0 text-lg">
                                      Kristin Watson
                                    </h6>

                                    <span className="text-secondary-light text-sm mb-0">
                                      English Teacher
                                    </span>
                                  </div>
                                </div>

                                <div className="text-end">
                                  <span className="d-block fw-bold text-primary-light">
                                    3 Days
                                  </span>

                                  <p className="text-secondary-light text-sm mb-0">
                                    Apply on: 10 April
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-xxl-4">
                  <div className="card h-100">
                    <div className="card-body p-0">
                      <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                        <h6 className="text-lg mb-0">Calendar</h6>
                      </div>

                      <div className="p-20">
                        <MiniCalendar />
                      </div>

                      <div className="ps-20 pt-20 pb-20 border-top border-neutral-200">
                        <h6 className="text-lg mb-20">Upcoming Events</h6>

                        <div className="pe-20 d-flex flex-column gap-32 overflow-y-auto max-h-500-px scroll-sm">
                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-purple-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  09:00 - 09:45
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  AM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Marketing Strategy Kickoff
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  Robert Fox
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-warning-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  11:15 - 12:00
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  AM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Product Design Brainstorm
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  Leslie Alexander
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-blue-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  02:00 - 03:00
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  PM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Client Feedback Review
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  Courtney Henry
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-success-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  04:15 - 05:00
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  PM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Sprint Planning & Task Allocation
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  Eleanor Pena
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-primary-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  01:15 - 02:00
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  PM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Client Feedback Review
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  John
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>

                          <div className="d-flex align-items-center justify-content-between gap-16">
                            <div className="ps-10 border-start-width-3-px border-warning-600">
                              <div className="d-flex align-items-end gap-6">
                                <h6 className="text-lg fw-normal mb-0">
                                  11:15 - 12:00
                                </h6>

                                <span className="text-xs text-secondary-light line-height-1 mb-2">
                                  AM
                                </span>
                              </div>

                              <p className="text-secondary-light mt-4 mb-2 text-sm">
                                Product Design Brainstorm
                              </p>

                              <p className="text-xs text-secondary-light mb-0">
                                Lead by{" "}
                                <a
                                  href="javascript:void(0)"
                                  className="text-primary-600 hover-underline"
                                >
                                  Leslie Alexander
                                </a>
                              </p>
                            </div>

                            <div>
                              <a
                                href="javascript:void(0)"
                                className="py-6 px-16 radius-4 bg-neutral-100 text-secondary-light fw-semibold bg-hover-primary-600 hover-text-white"
                              >
                                View
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-4 col-lg-6">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <img
                          src="/assets/images/icons/sheild-icon.png"
                          alt="Overview"
                          className="w-20-px h-20-px"
                        />
                      </span>
                      <h6 className="text-lg mb-0">User Overview</h6>
                    </div>

                    <div className="dropdown">
                      <button
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <iconify-icon
                          icon="entypo:dots-three-vertical"
                          className="icon text-secondary-light"
                        ></iconify-icon>
                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalView"
                          >
                            <iconify-icon
                              icon="hugeicons:view"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            View
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalEdit"
                          >
                            <iconify-icon
                              icon="lucide:edit"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Edit
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalDelete"
                          >
                            <iconify-icon
                              icon="fluent:delete-24-regular"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-20">
                    <div>
                      <div className="mt-40 mb-24 pe-110 position-relative max-w-288-px mx-auto">
                        <div className="w-170-px h-170-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/icons/radial-bg1.png"
                            alt="Image"
                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover"
                          />

                          <h5 className="text-white"> 60% </h5>
                        </div>

                        <div className="w-144-px h-144-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center position-absolute top-0 end-0 mt--36">
                          <img
                            src="/assets/images/icons/radial-bg2.png"
                            alt="Image"
                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover"
                          />

                          <h5 className="text-white"> 30% </h5>
                        </div>

                        <div className="w-110-px h-110-px rounded-circle z-1 position-relative d-inline-flex justify-content-center align-items-center position-absolute bottom-0 start-50 translate-middle-x ms-48">
                          <img
                            src="/assets/images/icons/radial-bg3.png"
                            alt="Image"
                            className="position-absolute top-0 start-0 z-n1 w-100 h-100 object-fit-cover"
                          />

                          <h5 className="text-white"> 10% </h5>
                        </div>
                      </div>

                      <div className="d-flex align-items-center flex-wrap gap-24 justify-content-evenly">
                        <div className="d-flex flex-column align-items-start">
                          <div className="d-flex align-items-center gap-2">
                            <span className="w-12-px h-12-px rounded-pill bg-success-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">
                              Student
                            </span>
                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">
                            750
                          </h6>
                        </div>

                        <div className="d-flex flex-column align-items-start">
                          <div className="d-flex align-items-center gap-2">
                            <span className="w-12-px h-12-px rounded-pill bg-warning-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">
                              Teacher
                            </span>
                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">
                            56
                          </h6>
                        </div>

                        <div className="d-flex flex-column align-items-start">
                          <div className="d-flex align-items-center gap-2">
                            <span className="w-12-px h-12-px rounded-pill bg-blue-600"></span>

                            <span className="text-secondary-light text-sm fw-normal">
                              Staffs{" "}
                            </span>
                          </div>

                          <h6 className="text-primary-light fw-semibold mb-0 mt-4 text-lg">
                            15
                          </h6>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-8 col-lg-6">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <img
                          src="/assets/images/icons/price-icon3.png"
                          alt="Income vs Expense"
                          className="w-20-px h-20-px"
                        />
                      </span>
                      <h6 className="text-lg mb-0">Income Vs Expense</h6>
                    </div>

                    <div className="dropdown">
                      <button
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <iconify-icon
                          icon="entypo:dots-three-vertical"
                          className="icon text-secondary-light"
                        ></iconify-icon>
                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalView"
                          >
                            <iconify-icon
                              icon="hugeicons:view"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            View
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalEdit"
                          >
                            <iconify-icon
                              icon="lucide:edit"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Edit
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalDelete"
                          >
                            <iconify-icon
                              icon="fluent:delete-24-regular"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-20">
                    <div className="w-100">
                      <div className="mb-16 d-flex flex-wrap justify-content-center gap-24">
                        <div className="d-flex align-items-center gap-10">
                          <span
                            className="w-12-px h-12-px rounded-circle"
                            style={{
                              background: "#25A194",
                              border: "2px solid rgba(0,0,0,0.06)",
                            }}
                          ></span>
                          <span className="text-secondary-light text-md">
                            Income:{" "}
                            <span className="text-primary-light fw-bold">
                              $500
                            </span>
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-10">
                          <span
                            className="w-12-px h-12-px rounded-circle"
                            style={{
                              background: "#FF7A2C",
                              border: "2px solid rgba(0,0,0,0.06)",
                            }}
                          ></span>
                          <span className="text-secondary-light text-md">
                            Expense:{" "}
                            <span className="text-primary-light fw-bold">
                              $300
                            </span>
                          </span>
                        </div>
                      </div>

                      <StepAreaChart
                        labels={[
                          "Jan",
                          "Feb",
                          "Mar",
                          "Apr",
                          "May",
                          "Jun",
                          "Jul",
                          "Aug",
                          "Sep",
                        ]}
                        series={[
                          {
                            name: "Income",
                            color: "#25A194",
                            fill: "#25A194",
                            data: [48, 35, 55, 32, 48, 30, 14, 50, 56],
                          },
                          {
                            name: "Expense",
                            color: "#FF7A2C",
                            fill: "#FF7A2C",
                            data: [10, 20, 12, 25, 22, 60, 40, 32, 24],
                          },
                        ]}
                        height={260}
                        maxValue={70}
                        tooltip
                        valueFormatter={(v) => `$${v}k`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-4 col-lg-6">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <h6 className="text-lg mb-0">Top Teachers</h6>

                    <div className="dropdown">
                      <button
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <iconify-icon
                          icon="entypo:dots-three-vertical"
                          className="icon text-secondary-light"
                        ></iconify-icon>
                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalView"
                          >
                            <iconify-icon
                              icon="hugeicons:view"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            View
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalEdit"
                          >
                            <iconify-icon
                              icon="lucide:edit"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Edit
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalDelete"
                          >
                            <iconify-icon
                              icon="fluent:delete-24-regular"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="ps-20 pt-20 pb-20">
                    <div className="pe-20 d-flex flex-column gap-20 max-h-462-px overflow-y-auto scroll-sm">
                      <div className="d-flex align-items-center justify-content-between gap-16">
                        <div className="d-flex align-items-start gap-16">
                          <img
                            src="/assets/images/thumbs/top-teacher-img1.png"
                            alt="Thumbnail"
                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                          />

                          <div className="">
                            <h6 className="mb-0 text-lg">Theresa Webb</h6>

                            <span className="text-secondary-light text-sm mb-0">
                              example@gmail.com
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="d-block fw-semibold text-primary-light">
                            Mathematics
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">
                        <div className="d-flex align-items-start gap-16">
                          <img
                            src="/assets/images/thumbs/top-teacher-img2.png"
                            alt="Thumbnail"
                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                          />

                          <div className="">
                            <h6 className="mb-0 text-lg">Darrell Steward</h6>

                            <span className="text-secondary-light text-sm mb-0">
                              example@gmail.com
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="d-block fw-semibold text-primary-light">
                            Physics
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">
                        <div className="d-flex align-items-start gap-16">
                          <img
                            src="/assets/images/thumbs/top-teacher-img3.png"
                            alt="Thumbnail"
                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                          />

                          <div className="">
                            <h6 className="mb-0 text-lg">Jane Cooper</h6>

                            <span className="text-secondary-light text-sm mb-0">
                              example@gmail.com
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="d-block fw-semibold text-primary-light">
                            Biology
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">
                        <div className="d-flex align-items-start gap-16">
                          <img
                            src="/assets/images/thumbs/top-teacher-img4.png"
                            alt="Thumbnail"
                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                          />

                          <div className="">
                            <h6 className="mb-0 text-lg">Savannah Nguyen</h6>

                            <span className="text-secondary-light text-sm mb-0">
                              example@gmail.com
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="d-block fw-semibold text-primary-light">
                            English
                          </span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-16">
                        <div className="d-flex align-items-start gap-16">
                          <img
                            src="/assets/images/thumbs/top-teacher-img5.png"
                            alt="Thumbnail"
                            className="w-40-px h-40-px rounded-circle object-fit-cover flex-shrink-0"
                          />

                          <div className="">
                            <h6 className="mb-0 text-lg">Eleanor Pena</h6>

                            <span className="text-secondary-light text-sm mb-0">
                              example@gmail.com
                            </span>
                          </div>
                        </div>

                        <div className="text-end">
                          <span className="d-block fw-semibold text-primary-light">
                            Math
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-4 col-lg-6">
              <div className="card h-100">
                <div className="card-body p-0">
                  <div className="d-flex flex-wrap align-items-center justify-content-between px-20 py-16 border-bottom border-neutral-200">
                    <div className="d-flex align-items-center gap-10">
                      <span className="w-32-px h-32-px bg-primary-50 rounded-circle d-flex justify-content-center align-items-center flex-shrink-0">
                        <img
                          src="/assets/images/icons/student-icon.png"
                          alt="New Admissions"
                          className="w-20-px h-20-px"
                        />
                      </span>
                      <h6 className="text-lg mb-0">New Admissions</h6>
                    </div>

                    <div className="dropdown">
                      <button
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                      >
                        <iconify-icon
                          icon="entypo:dots-three-vertical"
                          className="icon text-secondary-light"
                        ></iconify-icon>
                      </button>

                      <ul className="dropdown-menu p-12 border bg-base shadow">
                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalView"
                          >
                            <iconify-icon
                              icon="hugeicons:view"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            View
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalEdit"
                          >
                            <iconify-icon
                              icon="lucide:edit"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Edit
                          </button>
                        </li>

                        <li>
                          <button
                            type="button"
                            className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                            data-bs-toggle="modal"
                            data-bs-target="#exampleModalDelete"
                          >
                            <iconify-icon
                              icon="fluent:delete-24-regular"
                              className="icon text-lg line-height-1"
                            ></iconify-icon>
                            Delete
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-20">
                    <div className="position-relative text-center">
                      <DonutChart
                        segments={[
                          { label: "English", value: 15, color: "#00B341" },
                          { label: "Math", value: 15, color: "#0A51CE" },
                          { label: "Biology", value: 5, color: "#FF7A2C" },
                          { label: "Physics", value: 10, color: "#25A194" },
                        ]}
                        size={270}
                        thickness={36}
                        centerValue="45"
                        centerLabel="Total Admissions"
                        legendMode="values"
                        tooltip
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xxl-4">
              <div className="card radius-12 border-0 h-100">
                <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between py-12 px-20 border-bottom border-neutral-200">
                  <h6 className="mb-2 fw-bold text-lg">Top Student</h6>

                  <div className="dropdown">
                    <button
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <iconify-icon
                        icon="entypo:dots-three-vertical"
                        className="icon text-secondary-light"
                      ></iconify-icon>
                    </button>

                    <ul className="dropdown-menu p-12 border bg-base shadow">
                      <li>
                        <button
                          type="button"
                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                          data-bs-toggle="modal"
                          data-bs-target="#exampleModalView"
                        >
                          <iconify-icon
                            icon="hugeicons:view"
                            className="icon text-lg line-height-1"
                          ></iconify-icon>
                          View
                        </button>
                      </li>

                      <li>
                        <button
                          type="button"
                          className="dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-neutral-200 text-hover-neutral-900 d-flex align-items-center gap-10"
                          data-bs-toggle="modal"
                          data-bs-target="#exampleModalEdit"
                        >
                          <iconify-icon
                            icon="lucide:edit"
                            className="icon text-lg line-height-1"
                          ></iconify-icon>
                          Edit
                        </button>
                      </li>

                      <li>
                        <button
                          type="button"
                          className="delete-item dropdown-item px-16 py-8 rounded text-secondary-light bg-hover-danger-100 text-hover-danger-600 d-flex align-items-center gap-10"
                          data-bs-toggle="modal"
                          data-bs-target="#exampleModalDelete"
                        >
                          <iconify-icon
                            icon="fluent:delete-24-regular"
                            className="icon text-lg line-height-1"
                          ></iconify-icon>
                          Delete
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="card-body">
                  <div className="d-flex flex-column gap-28">
                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">
                      <div className="d-flex align-items-center gap-12">
                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/thumbs/avatar-img1.png"
                            className="w-44-px h-44-px object-fit-cover rounded-circle"
                            alt="Icon"
                          />
                        </span>

                        <div>
                          <div className="top-student-name">
                            Brooklyn Simmons
                          </div>
                          <div className="top-student-class text-secondary-light">
                            Class: Six
                          </div>
                        </div>
                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing
                          value={20}
                          color="#2F6BFF"
                          label="Marks 20"
                        />
                      </div>
                    </div>

                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">
                      <div className="d-flex align-items-center gap-12">
                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/thumbs/avatar-img2.png"
                            className="w-44-px h-44-px object-fit-cover rounded-circle"
                            alt="Icon"
                          />
                        </span>

                        <div>
                          <div className="top-student-name">Floyd Miles</div>
                          <div className="top-student-class text-secondary-light">
                            Class: Seven
                          </div>
                        </div>
                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing
                          value={35}
                          color="#FF7A2C"
                          label="Marks 35"
                        />
                      </div>
                    </div>

                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">
                      <div className="d-flex align-items-center gap-12">
                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/thumbs/avatar-img2.png"
                            className="w-44-px h-44-px object-fit-cover rounded-circle"
                            alt="Icon"
                          />
                        </span>

                        <div>
                          <div className="top-student-name">Courtney Henry</div>
                          <div className="top-student-class text-secondary-light">
                            Class: Eight
                          </div>
                        </div>
                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing
                          value={45}
                          color="#FFB020"
                          label="Marks 45"
                        />
                      </div>
                    </div>

                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">
                      <div className="d-flex align-items-center gap-12">
                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/thumbs/avatar-img4.png"
                            className="w-44-px h-44-px object-fit-cover rounded-circle"
                            alt="Icon"
                          />
                        </span>

                        <div>
                          <div className="top-student-name">Kathryn Murphy</div>
                          <div className="top-student-class text-secondary-light">
                            Class: Nine
                          </div>
                        </div>
                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing
                          value={65}
                          color="#22A06B"
                          label="Marks 65"
                        />
                      </div>
                    </div>

                    <div className="top-student-row d-flex align-items-center justify-content-between gap-10">
                      <div className="d-flex align-items-center gap-12">
                        <span className="w-44-px h-44-px rounded-circle d-flex justify-content-center align-items-center">
                          <img
                            src="/assets/images/thumbs/avatar-img5.png"
                            className="w-44-px h-44-px object-fit-cover rounded-circle"
                            alt="Icon"
                          />
                        </span>

                        <div>
                          <div className="top-student-name">Annette Black</div>
                          <div className="top-student-class text-secondary-light">
                            Class: Ten
                          </div>
                        </div>
                      </div>

                      <div className="top-student-marks">
                        <div className="top-student-marks-label">Marks</div>
                        <ProgressRing
                          value={65}
                          color="#2F6BFF"
                          label="Marks 65"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="d-footer">
        <div className="">
          <p className="mb-0 text-center">
            {" "}
            &copy; <span className="current-year"></span> Made With &#10084;
          </p>
        </div>
      </footer>
    </>
  );
};

export default Dashboard;
