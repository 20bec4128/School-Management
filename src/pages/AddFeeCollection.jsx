import { useCallback, useEffect, useMemo, useState } from "react";
import "../assets/css/addModalShared.css";

import { useAuth } from "../context/useAuth";
import { useManualSchoolScope } from "../hooks/useManualSchoolScope";
import { fetchSchoolsLookup } from "../apis/schoolsApi";
import { fetchClasses } from "../apis/classesApi";
import { fetchStudentsByClassSection } from "../apis/studentsApi";
import { fetchFeeTypes } from "../apis/feeTypesApi";
import { fetchDiscounts } from "../apis/discountsApi";
import {
  createFeeCollection,
  updateFeeCollection,
} from "../apis/feeCollectionApi";
import { normalizeRole } from "../utils/roles";
import ManualScopeSelectors from "../components/ManualScopeSelectors";

const EDIT_STORAGE_KEY = "edit-fee-collection-row";
const STEPS = [];

const emptyForm = {
  headOfficeId: "",
  schoolId: "",
  classId: "",
  studentId: "",
  feeTypeId: "",
  discountId: "",
  feeAmount: "0.00",
  month: "",
  isApplicableDiscount: "No",
  paidStatus: "Unpaid",
  note: "",
  grossAmount: "0.00",
  discount: "0.00",
  netAmount: "0.00",
  dueAmount: "0.00",
};

const FIELD_ICONS = {
  "Head Office": "ri-building-4-line",
  "School Name": "ri-school-line",
  Class: "ri-group-line",
  Student: "ri-user-3-line",
  "Fee Type": "ri-file-list-line",
  "Fee Amount": "ri-coin-line",
  Month: "ri-calendar-line",
  "Is Applicable Discount?": "ri-discount-line",
  "Discount Type": "ri-price-tag-3-line",
  "Paid Status": "ri-checkbox-circle-line",
  Note: "ri-file-text-line",
};

const monthOptions = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const applicableDiscountOptions = ["Yes", "No"];
const paidStatusOptions = ["Paid", "Unpaid", "Partial"];

const FormField = ({
  label,
  required,
  children,
  full = false,
  noIcon = false,
}) => {
  const icon = FIELD_ICONS[label] || "ri-edit-line";

  return (
    <div className={`avm-field${full ? " full" : ""}`}>
      <label className="avm-label">
        {label}
        {required && <span className="req"> *</span>}
      </label>

      {!noIcon ? (
        <div className="avm-input-with-icon" style={{ position: "relative" }}>
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#667085",
              fontSize: "0.95rem",
              lineHeight: 1,
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <i className={icon} />
          </span>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
};

const normalizeYesNo = (value) => {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (["yes", "true", "1"].includes(v)) return "Yes";
  if (["no", "false", "0"].includes(v)) return "No";
  return "";
};

const AddFeeCollection = ({ onNavigate } = {}) => {
  const {
    status,
    token,
    user,
    role: authRole,
    headOfficeId: authHeadOfficeId,
    headOfficeName,
    schoolId: authSchoolId,
    schoolName: authSchoolName,
  } = useAuth();

  const role = useMemo(
    () =>
      normalizeRole(
        authRole || user?.role || user?.userRole || user?.authority,
      ),
    [authRole, user],
  );
  const isSuperAdmin = role === "SUPER_ADMIN";
  const isHeadOfficeAdmin = role === "HEAD_OFFICE_ADMIN";
  const isSchoolAdmin = role === "SCHOOL_ADMIN";
  const navigateTo = typeof onNavigate === "function" ? onNavigate : null;

  const manualScope = useManualSchoolScope(isSuperAdmin);

  const [initialEditRow] = useState(() => {
    try {
      const raw = sessionStorage.getItem(EDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const editingId = initialEditRow?.id ?? null;
  const isEditMode = Boolean(editingId);

  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [feeTypes, setFeeTypes] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const activeStep = 0;
  const goToStep = () => {};
  const handleBack = () => {};

  const [form, setForm] = useState(() => {
    if (initialEditRow) {
      return {
        ...emptyForm,
        headOfficeId:
          initialEditRow?.headOfficeId != null
            ? String(initialEditRow.headOfficeId)
            : "",
        schoolId:
          initialEditRow?.schoolId != null
            ? String(initialEditRow.schoolId)
            : "",
        classId:
          initialEditRow?.classId != null ? String(initialEditRow.classId) : "",
        studentId:
          initialEditRow?.studentId != null
            ? String(initialEditRow.studentId)
            : "",
        feeTypeId:
          initialEditRow?.feeTypeId != null
            ? String(initialEditRow.feeTypeId)
            : "",
        discountId:
          initialEditRow?.discountId != null
            ? String(initialEditRow.discountId)
            : "",
        feeAmount:
          initialEditRow?.feeAmount != null
            ? String(initialEditRow.feeAmount)
            : "0.00",
        month: initialEditRow?.month || "",
        isApplicableDiscount:
          normalizeYesNo(initialEditRow?.isApplicableDiscount) || "No",
        paidStatus: initialEditRow?.paidStatus || "Unpaid",
        note: initialEditRow?.note || "",
        grossAmount:
          initialEditRow?.grossAmount != null
            ? String(initialEditRow.grossAmount)
            : "0.00",
        discount:
          initialEditRow?.discount != null
            ? String(initialEditRow.discount)
            : "0.00",
        netAmount:
          initialEditRow?.netAmount != null
            ? String(initialEditRow.netAmount)
            : "0.00",
        dueAmount:
          initialEditRow?.dueAmount != null
            ? String(initialEditRow.dueAmount)
            : "0.00",
      };
    }

    const base = { ...emptyForm };
    if (isSchoolAdmin) {
      base.headOfficeId =
        authHeadOfficeId != null ? String(authHeadOfficeId) : "";
      base.schoolId = authSchoolId != null ? String(authSchoolId) : "";
    } else if (isHeadOfficeAdmin) {
      base.headOfficeId =
        authHeadOfficeId != null ? String(authHeadOfficeId) : "";
    }
    return base;
  });

  const schoolsById = useMemo(() => {
    const map = new Map();
    for (const item of Array.isArray(schools) ? schools : []) {
      if (item?.id == null) continue;
      map.set(String(item.id), item);
    }
    return map;
  }, [schools]);

  const selectedSchool = useMemo(
    () => (form.schoolId ? schoolsById.get(String(form.schoolId)) : null),
    [form.schoolId, schoolsById],
  );

  useEffect(
    () => () => {
      try {
        sessionStorage.removeItem(EDIT_STORAGE_KEY);
      } catch {}
    },
    [],
  );

  useEffect(() => {
    if (status !== "ready" || !token) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [schoolList, classList] = await Promise.all([
          fetchSchoolsLookup(),
          fetchClasses(),
        ]);

        if (cancelled) return;
        setSchools(Array.isArray(schoolList) ? schoolList : []);
        setClasses(Array.isArray(classList) ? classList : []);
      } catch {
        if (cancelled) return;
        setSchools([]);
        setClasses([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  useEffect(() => {
    if (!initialEditRow || !isSuperAdmin) return;
    if (manualScope.selectedHeadOfficeId && manualScope.selectedSchoolId)
      return;

    const school =
      initialEditRow?.schoolId != null
        ? schoolsById.get(String(initialEditRow.schoolId))
        : null;

    const headOfficeId = initialEditRow?.headOfficeId ?? school?.headOfficeId;
    if (!headOfficeId) return;

    manualScope.setSelectedScope(
      String(headOfficeId),
      initialEditRow?.schoolId != null ? String(initialEditRow.schoolId) : "",
    );
  }, [
    initialEditRow,
    isSuperAdmin,
    manualScope,
    manualScope.selectedHeadOfficeId,
    manualScope.selectedSchoolId,
    schoolsById,
  ]);

  useEffect(() => {
    if (isSchoolAdmin) return;
    if (!selectedSchool?.headOfficeId) return;
    if (form.headOfficeId) return;

    setForm((prev) => ({
      ...prev,
      headOfficeId: String(selectedSchool.headOfficeId),
    }));
  }, [isSchoolAdmin, selectedSchool?.headOfficeId, form.headOfficeId]);

  const schoolOptions = useMemo(() => {
    const rows = Array.isArray(schools) ? schools : [];

    if (isSuperAdmin) {
      if (!manualScope.selectedHeadOfficeId) return [];
      return rows.filter(
        (school) =>
          String(school?.headOfficeId ?? "") ===
          String(manualScope.selectedHeadOfficeId),
      );
    }

    if (isHeadOfficeAdmin) {
      return rows.filter(
        (school) =>
          String(school?.headOfficeId ?? "") === String(authHeadOfficeId ?? ""),
      );
    }

    if (isSchoolAdmin) {
      return rows.filter(
        (school) => String(school?.id ?? "") === String(authSchoolId ?? ""),
      );
    }

    return rows;
  }, [
    schools,
    isSuperAdmin,
    isHeadOfficeAdmin,
    isSchoolAdmin,
    manualScope.selectedHeadOfficeId,
    authHeadOfficeId,
    authSchoolId,
  ]);

  const currentSchoolId = isSchoolAdmin ? authSchoolId : form.schoolId;
  const classOptions = useMemo(() => {
    const list = Array.isArray(classes) ? classes : [];
    if (!currentSchoolId) return [];
    return list.filter(
      (row) => String(row?.schoolId ?? "") === String(currentSchoolId),
    );
  }, [classes, currentSchoolId]);

  const calculateDiscountAmount = useCallback(
    (discountId, draftForm = form) => {
      const selected = (Array.isArray(discounts) ? discounts : []).find(
        (item) => String(item?.id ?? "") === String(discountId),
      );

      if (!selected || draftForm?.isApplicableDiscount !== "Yes") return 0;

      const feeAmount = Number(draftForm?.feeAmount || 0);
      const baseAmount = Number(selected?.amount || 0);

      if (String(selected?.discountType || "").toLowerCase() === "percentage") {
        return (feeAmount * baseAmount) / 100;
      }

      return baseAmount;
    },
    [discounts, form],
  );

  const recalcTotals = useCallback(
    (draftForm, nextDiscountId = draftForm?.discountId) => {
      const feeAmount = Number(draftForm?.feeAmount || 0);
      const discountAmount =
        draftForm?.isApplicableDiscount === "Yes"
          ? calculateDiscountAmount(nextDiscountId, draftForm)
          : 0;
      const netAmount = Math.max(feeAmount - discountAmount, 0);
      const dueAmount = draftForm?.paidStatus === "Paid" ? 0 : netAmount;

      return {
        discountId:
          draftForm?.isApplicableDiscount === "Yes" ? nextDiscountId || "" : "",
        grossAmount: feeAmount.toFixed(2),
        discount: discountAmount.toFixed(2),
        netAmount: netAmount.toFixed(2),
        dueAmount: dueAmount.toFixed(2),
      };
    },
    [calculateDiscountAmount],
  );

  useEffect(() => {
    if (!currentSchoolId) {
      setFeeTypes([]);
      setDiscounts([]);
      return;
    }

    fetchFeeTypes({ schoolId: currentSchoolId })
      .then((data) => setFeeTypes(Array.isArray(data) ? data : []))
      .catch(() => setFeeTypes([]));

    fetchDiscounts({ schoolId: currentSchoolId })
      .then((data) => setDiscounts(Array.isArray(data) ? data : []))
      .catch(() => setDiscounts([]));
  }, [currentSchoolId]);

  useEffect(() => {
    if (!currentSchoolId || !form.classId) {
      setStudents([]);
      return;
    }

    fetchStudentsByClassSection({
      schoolId: currentSchoolId,
      classId: form.classId,
    })
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]));
  }, [currentSchoolId, form.classId]);

  useEffect(() => {
    if (!currentSchoolId) return;
    setForm((prev) => ({
      ...prev,
      headOfficeId:
        isSchoolAdmin || isHeadOfficeAdmin
          ? authHeadOfficeId != null
            ? String(authHeadOfficeId)
            : prev.headOfficeId
          : prev.headOfficeId,
      schoolId: isSchoolAdmin
        ? authSchoolId != null
          ? String(authSchoolId)
          : prev.schoolId
        : prev.schoolId,
    }));
  }, [
    currentSchoolId,
    isSchoolAdmin,
    isHeadOfficeAdmin,
    authHeadOfficeId,
    authSchoolId,
  ]);

  const handleChange = (e) => {
    const { id, value } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [id]: value,
        ...(id === "headOfficeId"
          ? {
              schoolId: "",
              classId: "",
              studentId: "",
              feeTypeId: "",
              discountId: "",
            }
          : {}),
        ...(id === "schoolId"
          ? { classId: "", studentId: "", feeTypeId: "", discountId: "" }
          : {}),
        ...(id === "classId" ? { studentId: "" } : {}),
        ...(id === "discountId"
          ? recalcTotals(
              { ...prev, [id]: value, isApplicableDiscount: "Yes" },
              value,
            )
          : {}),
        ...(id === "feeAmount" ||
        id === "isApplicableDiscount" ||
        id === "paidStatus"
          ? recalcTotals({ ...prev, [id]: value }, prev.discountId)
          : {}),
      };

      return next;
    });

    if (id === "headOfficeId" && isSuperAdmin) {
      manualScope.setSelectedScope(value, "");
    }

    if (id === "schoolId" && isSuperAdmin) {
      manualScope.setSelectedScope(form.headOfficeId, value);
    }
  };

  const validate = () => {
    if (isSuperAdmin && !String(form.headOfficeId || "").trim())
      return "Head office is required.";
    if (!String(currentSchoolId || "").trim()) return "School is required.";
    if (!String(form.classId || "").trim()) return "Class is required.";
    if (!String(form.studentId || "").trim()) return "Student is required.";
    if (!String(form.feeTypeId || "").trim()) return "Fee type is required.";
    if (!String(form.feeAmount || "").trim()) return "Fee amount is required.";
    if (!String(form.month || "").trim()) return "Month is required.";
    if (!String(form.isApplicableDiscount || "").trim())
      return "Discount selection is required.";
    if (
      form.isApplicableDiscount === "Yes" &&
      !String(form.discountId || "").trim()
    ) {
      return "Discount type is required.";
    }
    if (!String(form.paidStatus || "").trim())
      return "Paid status is required.";
    return "";
  };

  const buildPayload = () => {
    const feeAmount = Number(form.feeAmount || 0);
    const discountAmount =
      form.isApplicableDiscount === "Yes"
        ? calculateDiscountAmount(form.discountId, form)
        : 0;
    const netAmount = Math.max(feeAmount - discountAmount, 0);
    const dueAmount = form.paidStatus === "Paid" ? 0 : netAmount;

    return {
      headOfficeId: form.headOfficeId ? Number(form.headOfficeId) : null,
      schoolId: Number(currentSchoolId),
      classId: Number(form.classId),
      studentId: Number(form.studentId),
      feeTypeId: Number(form.feeTypeId),
      discountId:
        form.isApplicableDiscount === "Yes" && form.discountId
          ? Number(form.discountId)
          : null,
      feeAmount,
      month: String(form.month || ""),
      isApplicableDiscount: form.isApplicableDiscount === "Yes",
      paidStatus: String(form.paidStatus || "Unpaid"),
      note: form.note || "",
      grossAmount: feeAmount,
      netAmount,
      discount: discountAmount,
      dueAmount,
    };
  };

  const save = async () => {
    const message = validate();
    if (message) {
      setError(message);
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = buildPayload();
      if (editingId) {
        await updateFeeCollection(editingId, payload);
      } else {
        await createFeeCollection(payload);
      }

      setSuccess(true);
      setTimeout(() => {
        navigateTo?.("fee-collection");
      }, 900);
    } catch (err) {
      setError(
        err?.message ||
          (editingId ? "Failed to update invoice" : "Failed to create invoice"),
      );
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (activeStep === 0) {
      return (
        <div className="avm-grid">
          {isSuperAdmin ? (
            <div style={{ gridColumn: "1 / -1" }}>
              <ManualScopeSelectors
                enabled
                compact
                headOffices={manualScope.headOffices}
                schoolOptions={schoolOptions}
                selectedHeadOfficeId={manualScope.selectedHeadOfficeId}
                onHeadOfficeChange={(val) => {
                  manualScope.setSelectedScope(val, "");
                  setForm((prev) => ({
                    ...prev,
                    headOfficeId: val,
                    schoolId: "",
                    classId: "",
                    studentId: "",
                    feeTypeId: "",
                    discountId: "",
                  }));
                }}
                selectedSchoolId={form.schoolId}
                onSchoolChange={(val) => {
                  manualScope.setSelectedScope(form.headOfficeId, val);
                  setForm((prev) => ({
                    ...prev,
                    schoolId: val,
                    classId: "",
                    studentId: "",
                    feeTypeId: "",
                    discountId: "",
                  }));
                }}
              />
            </div>
          ) : isHeadOfficeAdmin ? (
            <>
              <FormField label="Head Office" required>
                <input
                  className="avm-input"
                  value={headOfficeName || ""}
                  readOnly
                />
              </FormField>
              <FormField label="School Name" required>
                <select
                  className="avm-select"
                  id="schoolId"
                  value={form.schoolId}
                  onChange={handleChange}
                  disabled
                >
                  <option value="">--Select School--</option>
                  {schoolOptions.map((option) => (
                    <option key={option.id} value={String(option.id)}>
                      {option.schoolName}
                    </option>
                  ))}
                </select>
              </FormField>
            </>
          ) : isSchoolAdmin ? (
            <>
              <FormField label="Head Office" required>
                <input
                  className="avm-input"
                  value={headOfficeName || ""}
                  readOnly
                />
              </FormField>
              <FormField label="School Name" required >
                <input
                  className="avm-input"
                  value={authSchoolName || ""}
                  readOnly
                />
              </FormField>
            </>
          ) : null}

          <FormField label="Class" required>
            <select
              className="avm-select"
              id="classId"
              value={form.classId}
              onChange={handleChange}
              disabled={!currentSchoolId}
            >
              <option value="">--Select--</option>
              {classOptions.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.className}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Student" required>
            <select
              className="avm-select"
              id="studentId"
              value={form.studentId}
              onChange={handleChange}
              disabled={!form.classId}
            >
              <option value="">--Select--</option>
              {students.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.name}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ gridColumn: "1 / -1" }}>
            <p className="avm-section-title">Fee Details</p>
          </div>

          <FormField label="Fee Type" required>
            <select
              className="avm-select"
              id="feeTypeId"
              value={form.feeTypeId}
              onChange={handleChange}
              disabled={!currentSchoolId}
            >
              <option value="">--Select--</option>
              {feeTypes.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.title || option.feeType}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fee Amount" required>
            <input
              type="number"
              className="avm-input"
              id="feeAmount"
              value={form.feeAmount}
              onChange={handleChange}
              step="0.01"
            />
          </FormField>

          <FormField label="Month" required>
            <select
              className="avm-select"
              id="month"
              value={form.month}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <div style={{ gridColumn: "1 / -1" }}>
            <p className="avm-section-title">Payment Details</p>
          </div>

          <FormField label="Is Applicable Discount?" required>
            <select
              className="avm-select"
              id="isApplicableDiscount"
              value={form.isApplicableDiscount}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {applicableDiscountOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          {form.isApplicableDiscount === "Yes" ? (
            <FormField label="Discount Type" required>
              <select
                className="avm-select"
                id="discountId"
                value={form.discountId}
                onChange={handleChange}
                disabled={!currentSchoolId}
              >
                <option value="">--Select Discount Type--</option>
                {discounts.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.title} (
                    {option.discountType === "Percentage"
                      ? `${option.amount}%`
                      : `₹${Number(option.amount || 0).toFixed(2)}`}
                    )
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label="Paid Status" required>
            <select
              className="avm-select"
              id="paidStatus"
              value={form.paidStatus}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {paidStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              rows="3"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note (optional)"
              value={form.note}
              onChange={handleChange}
            />
          </FormField>
        </div>
      );
    }

    if (activeStep === 1) {
      return (
        <div className="avm-grid">
          <FormField label="Fee Type" required>
            <select
              className="avm-select"
              id="feeTypeId"
              value={form.feeTypeId}
              onChange={handleChange}
              disabled={!currentSchoolId}
            >
              <option value="">--Select--</option>
              {feeTypes.map((option) => (
                <option key={option.id} value={String(option.id)}>
                  {option.title || option.feeType}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Fee Amount" required>
            <input
              type="number"
              className="avm-input"
              id="feeAmount"
              value={form.feeAmount}
              onChange={handleChange}
              step="0.01"
            />
          </FormField>

          <FormField label="Month" required>
            <select
              className="avm-select"
              id="month"
              value={form.month}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {monthOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="avm-grid">
          <FormField label="Is Applicable Discount?" required>
            <select
              className="avm-select"
              id="isApplicableDiscount"
              value={form.isApplicableDiscount}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {applicableDiscountOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          {form.isApplicableDiscount === "Yes" ? (
            <FormField label="Discount Type" required>
              <select
                className="avm-select"
                id="discountId"
                value={form.discountId}
                onChange={handleChange}
                disabled={!currentSchoolId}
              >
                <option value="">--Select Discount Type--</option>
                {discounts.map((option) => (
                  <option key={option.id} value={String(option.id)}>
                    {option.title} (
                    {option.discountType === "Percentage"
                      ? `${option.amount}%`
                      : `₹${Number(option.amount || 0).toFixed(2)}`}
                    )
                  </option>
                ))}
              </select>
            </FormField>
          ) : null}

          <FormField label="Paid Status" required>
            <select
              className="avm-select"
              id="paidStatus"
              value={form.paidStatus}
              onChange={handleChange}
            >
              <option value="">--Select--</option>
              {paidStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Note" full noIcon>
            <textarea
              rows="3"
              className="avm-input avm-textarea"
              id="note"
              placeholder="Enter note (optional)"
              value={form.note}
              onChange={handleChange}
            />
          </FormField>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="dashboard-main-body">
      <div className="breadcrumb d-flex flex-wrap align-items-center justify-content-between gap-3 mb-24">
        <div>
          <h1 className="fw-semibold mb-4 h6 text-primary-light">
            {isEditMode ? "Edit" : "Add"} Fee Collection
          </h1>

          <div>
            <button
              type="button"
              className="text-secondary-light hover-text-primary hover-underline border-0 bg-transparent px-0"
              onClick={() => navigateTo?.("dashboard")}
            >
              Dashboard
            </button>

            <span className="text-secondary-light">
              {" "}
              / Fee Collection / {isEditMode ? "Edit" : "Add"}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="btn btn-light border d-flex align-items-center gap-6"
          onClick={() => navigateTo?.("fee-collection")}
        >
          <i className="ri-arrow-left-line" /> Back to List
        </button>
      </div>

      <div className="card h-100">
        {STEPS.length > 0 ? (
          <div className="card-header border-bottom border-neutral-200 px-20 py-0 d-flex gap-0 scroll-x-mobile">
            {STEPS.map((tab, idx) => (
              <button
                key={tab}
                type="button"
                onClick={() => goToStep(idx)}
                style={{
                  background: "none",
                  border: "none",
                  borderBottom:
                    activeStep === idx
                      ? "2px solid var(--primary-600, #4f46e5)"
                      : "2px solid transparent",
                  color:
                    activeStep === idx
                      ? "var(--primary-600, #4f46e5)"
                      : "var(--secondary-light, #667085)",
                  fontWeight: activeStep === idx ? 600 : 400,
                  padding: "14px 20px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        ) : null}

        <div className="card-body p-24">
          {error ? (
            <div className="alert alert-danger d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-error-warning-line text-lg" />
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="alert alert-success d-flex align-items-center gap-10 mb-24 radius-8">
              <i className="ri-checkbox-circle-line text-lg" />
              Fee collection {isEditMode ? "updated" : "created"} successfully!
              Redirecting...
            </div>
          ) : null}

          <div className="tab-content">{renderStep()}</div>

          <div className="d-flex align-items-center justify-content-end gap-10 mt-24 pt-20 border-top border-neutral-200">
            {activeStep > 0 ? (
              <button
                type="button"
                className="btn btn-light border px-24"
                onClick={handleBack}
              >
                Back
              </button>
            ) : null}

            <button
              type="button"
              className="btn btn-light border px-24"
              onClick={() => navigateTo?.("fee-collection")}
            >
              Cancel
            </button>

            {activeStep < STEPS.length - 1 ? (
              <button
                type="button"
                className="btn btn-primary-600 px-24"
                onClick={handleNext}
              >
                Next Step
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary-600 px-24 d-flex align-items-center gap-8"
                onClick={save}
                disabled={saving || loading}
              >
                {saving ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm"
                      role="status"
                      aria-hidden="true"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="ri-save-line" />
                    {isEditMode ? "Update Invoice" : "Create Invoice"}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFeeCollection;
