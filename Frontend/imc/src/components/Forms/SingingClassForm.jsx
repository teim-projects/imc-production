// src/components/SingingClassManagement.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BookOpen, UserCheck, Calendar, Users, X } from "lucide-react";
import StudentForm from "../Forms/StudentForm";
import BatchFormModal from "../Forms/BatchFormModal";
import TeacherFormModal from "../Forms/TeacherFormModal";
import ClassFormModal from "../Forms/ClassFormModal";

const BASE = import.meta?.env?.VITE_BASE_API_URL || "http://127.0.0.1:8000";

const CLASS_API = `${BASE.replace(/\/$/, "")}/auth/classes/`;
const TEACHER_API = `${BASE.replace(/\/$/, "")}/auth/teachers/`;
const BATCH_API = `${BASE.replace(/\/$/, "")}/auth/batches/`;

const api = axios.create();
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  return config;
});

export default function SingingClassManagement() {
  const [activeTab, setActiveTab] = useState("students");

  // === CLASS STATE ===
  const [classes, setClasses] = useState([]);
  const [classLoading, setClassLoading] = useState(false);
  const [classError, setClassError] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [classForm, setClassForm] = useState({
    name: "",
    trainer: "",
    fee: "",
    description: "",
  });

  // === TEACHERS STATE ===
  const [teachers, setTeachers] = useState([]);
  const [teacherLoading, setTeacherLoading] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({});

  // === BATCHES STATE ===
  const [batches, setBatches] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchError, setBatchError] = useState("");
  const [batchSearch, setBatchSearch] = useState("");
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const titles = {
    class: "Class Management",
    teachers: "Teachers Management",
    batch: "Batch Management",
    students: "Students Management",
  };

  // === CLASS LOGIC ===
  useEffect(() => {
    if (activeTab === "class") fetchClasses();
  }, [activeTab]);

  const fetchClasses = async () => {
    setClassLoading(true);
    setClassError("");
    try {
      const res = await api.get(CLASS_API);
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setClasses(data);
    } catch (err) {
      setClassError("Failed to load classes.");
      console.error(err);
      setClasses([]);
    } finally {
      setClassLoading(false);
    }
  };

  const openAddClass = () => {
    setClassForm({ name: "", trainer: "", fee: "", description: "" });
    setEditingClass(null);
    setShowClassModal(true);
  };

  const openEditClass = (cls) => {
    setClassForm({
      name: cls.name || "",
      trainer: cls.trainer || "",
      fee: cls.fee || "",
      description: cls.description || "",
    });
    setEditingClass(cls);
    setShowClassModal(true);
  };

  const handleSaveClass = async () => {
    try {
      const payload = {
        name: classForm.name,
        trainer: classForm.trainer ? Number(classForm.trainer) : null,
        fee: classForm.fee ? Number(classForm.fee) : null,
        description: classForm.description || null,
      };

      if (editingClass) {
        await api.put(`${CLASS_API}${editingClass.id}/`, payload);
      } else {
        await api.post(CLASS_API, payload);
      }
      setShowClassModal(false);
      setEditingClass(null);
      fetchClasses();
    } catch (err) {
      alert("Failed to save class");
      console.error(err);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Delete this class? This may affect related batches.")) return;
    try {
      await api.delete(`${CLASS_API}${id}/`);
      fetchClasses();
    } catch (err) {
      alert("Failed to delete class");
      console.error(err);
    }
  };

  const filteredClasses = useMemo(() => {
    const q = classSearch.toLowerCase().trim();
    if (!q) return classes;

    return classes.filter((c) => {
      const trainerName = c.trainer_name || "-";
      return (
        c.name?.toLowerCase().includes(q) ||
        trainerName.toLowerCase().includes(q) ||
        String(c.fee || "").includes(q) ||
        c.description?.toLowerCase().includes(q)
      );
    });
  }, [classes, classSearch]);

  // === TEACHERS LOGIC ===
  useEffect(() => {
    if (activeTab === "teachers") fetchTeachers();
  }, [activeTab]);

  const fetchTeachers = async () => {
    setTeacherLoading(true);
    try {
      const res = await api.get(TEACHER_API);
      setTeachers(Array.isArray(res.data) ? res.data : res.data.results || []);
    } catch (err) {
      console.error(err);
      setTeachers([]);
    } finally {
      setTeacherLoading(false);
    }
  };

  const openAddTeacher = () => {
    setTeacherForm({});
    setEditingTeacher(null);
    setShowTeacherModal(true);
  };

  const openEditTeacher = (teacher) => {
    setTeacherForm(teacher);
    setEditingTeacher(teacher);
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async () => {
    try {
      if (editingTeacher) {
        await api.put(`${TEACHER_API}${editingTeacher.id}/`, teacherForm);
      } else {
        await api.post(TEACHER_API, teacherForm);
      }
      setShowTeacherModal(false);
      fetchTeachers();
    } catch (err) {
      alert("Failed to save teacher");
    }
  };

  const handleDeleteTeacher = async (id) => {
    if (!window.confirm("Delete this teacher?")) return;
    try {
      await api.delete(`${TEACHER_API}${id}/`);
      fetchTeachers();
    } catch (err) {
      alert("Failed to delete teacher");
    }
  };

  // === BATCHES LOGIC ===
  useEffect(() => {
    if (activeTab === "batch") fetchBatches();
  }, [activeTab]);

  const fetchBatches = async () => {
    setBatchLoading(true);
    setBatchError("");
    try {
      const res = await api.get(BATCH_API, { params: { page_size: 100 } });
      const data = Array.isArray(res.data) ? res.data : res.data.results || [];
      setBatches(data);
    } catch (err) {
      setBatchError("Failed to load batches.");
      console.error(err);
    } finally {
      setBatchLoading(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!window.confirm("Delete this batch?")) return;
    try {
      await api.delete(`${BATCH_API}${id}/`);
      setBatches((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      alert("Failed to delete batch.");
    }
  };

  const openBatchDetail = (batch) => {
    setSelectedBatch(batch);
    setDrawerOpen(true);
  };

  const closeDetail = () => {
    setDrawerOpen(false);
    setTimeout(() => setSelectedBatch(null), 300);
  };

  const filteredBatches = useMemo(() => {
    const q = batchSearch.toLowerCase().trim();
    if (!q) return batches;
    return batches.filter((b) =>
      `${b.day || ""} ${b.time_slot || ""} ${b.trainer_name || b.trainer?.name || ""} ${b.class_name || b.class_obj?.name || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [batches, batchSearch]);

  // Enhanced selectedBatch with fallbacks (same logic as enrollment form)
  const displayBatch = useMemo(() => {
    if (!selectedBatch) return null;

    return {
      ...selectedBatch,
      displayClassName: selectedBatch.class_name || selectedBatch.class_obj?.name || "Not set",
      displayTrainerName: selectedBatch.trainer_name || selectedBatch.trainer?.name || "Not assigned",
      displayFee: selectedBatch.class_fee ?? selectedBatch.class_obj?.fee ?? null,
    };
  }, [selectedBatch]);

  return (
    <div className="singing-page">
      <div className="page-header">
        <h1>Singing Class</h1>
        <p>Manage singing class details here.</p>
      </div>

      <div className="tabs-wrapper">
        <div className="tabs">
          <Tab icon={<BookOpen size={18} />} label="Class" active={activeTab === "class"} onClick={() => setActiveTab("class")} />
          <Tab icon={<UserCheck size={18} />} label="Teachers" active={activeTab === "teachers"} onClick={() => setActiveTab("teachers")} />
          <Tab icon={<Calendar size={18} />} label="Batch" active={activeTab === "batch"} onClick={() => setActiveTab("batch")} />
          <Tab icon={<Users size={18} />} label="Students" active={activeTab === "students"} onClick={() => setActiveTab("students")} />
        </div>
      </div>

      <div className="main-card">
        <div className="card-header">
          <h2>{titles[activeTab]}</h2>

          {["class", "teachers", "batch"].includes(activeTab) && (
            <button
              className="add-btn"
              onClick={() => {
                if (activeTab === "class") openAddClass();
                if (activeTab === "teachers") openAddTeacher();
                if (activeTab === "batch") {
                  setSelectedBatch(null);
                  setShowBatchModal(true);
                }
              }}
            >
              + Add {activeTab === "class" ? "Class" : activeTab === "teachers" ? "Teacher" : "Batch"}
            </button>
          )}
        </div>

        {(activeTab === "class" || activeTab === "batch") && (
          <div className="search-wrapper">
            <input
              type="text"
              placeholder={`Search by ${activeTab === "class" ? "name, trainer, fee" : "day, time, teacher"}...`}
              className="search-input"
              value={activeTab === "class" ? classSearch : batchSearch}
              onChange={(e) => activeTab === "class" ? setClassSearch(e.target.value) : setBatchSearch(e.target.value)}
            />
            <button
              className="refresh-btn"
              onClick={activeTab === "class" ? fetchClasses : fetchBatches}
              disabled={activeTab === "class" ? classLoading : batchLoading}
            >
              {activeTab === "class" ? (classLoading ? "Loading..." : "Refresh") : (batchLoading ? "Loading..." : "Refresh")}
            </button>
          </div>
        )}

        <div className="content-area">
          {/* CLASS TAB */}
          {activeTab === "class" && (
            <div className="list-view">
              {classError && <div className="error-banner">{classError}</div>}
              {classLoading ? (
                <div className="loading">Loading classes...</div>
              ) : filteredClasses.length === 0 ? (
                <div className="empty">
                  <h3>No Classes Yet</h3>
                  <p>Click "+ Add Class" to create one.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Trainer</th>
                      <th>Fee (₹/month)</th>
                      <th>Description</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClasses.map((cls) => (
                      <tr key={cls.id}>
                        <td><strong>{cls.name}</strong></td>
                        <td>{cls.trainer_name || "-"}</td>
                        <td>{cls.fee ? `₹${cls.fee}` : "-"}</td>
                        <td>{cls.description || "-"}</td>
                        <td className="actions">
                          <button className="mini edit" onClick={() => openEditClass(cls)}>Edit</button>
                          <button className="mini delete" onClick={() => handleDeleteClass(cls.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === "teachers" && (
            <div className="list-view">
              {teacherLoading ? (
                <div className="loading">Loading teachers...</div>
              ) : teachers.length === 0 ? (
                <div className="empty">
                  <h3>No Teachers Yet</h3>
                  <p>Click "+ Add Teacher" to begin.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Expertise</th>
                      <th>Phone</th>
                      <th>Email</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name || `${t.first_name || ""} ${t.last_name || ""}`.trim()}</td>
                        <td>{t.expertise || "-"}</td>
                        <td>{t.phone || "-"}</td>
                        <td>{t.email || "-"}</td>
                        <td className="actions">
                          <button className="mini edit" onClick={() => openEditTeacher(t)}>Edit</button>
                          <button className="mini delete" onClick={() => handleDeleteTeacher(t.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* BATCH TAB */}
          {activeTab === "batch" && (
            <div className="list-view">
              {batchError && <div className="error-banner">{batchError}</div>}
              {batchLoading ? (
                <div className="loading">Loading batches...</div>
              ) : filteredBatches.length === 0 ? (
                <div className="empty">
                  <h3>No Batches Yet</h3>
                  <p>Click “+ Add Batch” to create one.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Day</th>
                      <th>Time Slot</th>
                      <th>Teacher</th>
                      <th>Class</th>
                      <th>Capacity</th>
                      <th className="actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBatches.map((batch) => {
                      const className = batch.class_name || batch.class_obj?.name || "-";
                      const trainerName = batch.trainer_name || batch.trainer?.name || "-";
                      return (
                        <tr key={batch.id}>
                          <td className="clickable" onClick={() => openBatchDetail(batch)}>
                            {batch.day || "-"}
                          </td>
                          <td>{batch.time_slot || "-"}</td>
                          <td>{trainerName}</td>
                          <td>{className}</td>
                          <td>{batch.capacity || "-"}</td>
                          <td className="actions">
                            <button
                              className="mini edit"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBatch(batch);
                                setShowBatchModal(true);
                              }}
                            >
                              Edit
                            </button>
                            <button className="mini delete" onClick={() => handleDeleteBatch(batch.id)}>
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === "students" && (
            <div className="direct-form">
              <StudentForm onSuccess={() => {}} />
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      <ClassFormModal
        isOpen={showClassModal}
        onClose={() => {
          setShowClassModal(false);
          setEditingClass(null);
        }}
        form={classForm}
        setForm={setClassForm}
        onSave={handleSaveClass}
        isEdit={!!editingClass}
        saving={false}
      />

      <TeacherFormModal
        isOpen={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        form={teacherForm}
        setForm={setTeacherForm}
        onSave={handleSaveTeacher}
        isEdit={!!editingTeacher}
      />

      {showBatchModal && (
        <BatchFormModal
          editData={selectedBatch}
          classes={classes}
          batches={batches}
          onClose={() => {
            setShowBatchModal(false);
            setSelectedBatch(null);
          }}
          onSaved={() => {
            setShowBatchModal(false);
            setSelectedBatch(null);
            fetchBatches();
          }}
        />
      )}

      {/* BATCH DETAIL DRAWER - NOW FULLY FIXED WITH FALLBACKS */}
      <div className={`drawer ${drawerOpen ? "open" : ""}`}>
        <div className="drawer-content">
          <button className="close-btn" onClick={closeDetail}><X size={24} /></button>
          {displayBatch && (
            <>
              <h3>Batch Details</h3>
              <div className="detail-grid">
                <p><strong>Class:</strong> {displayBatch.displayClassName}</p>
                <p><strong>Day & Time:</strong> {displayBatch.day} | {displayBatch.time_slot}</p>
                <p><strong>Teacher:</strong> {displayBatch.displayTrainerName}</p>
                <p><strong>Monthly Fee:</strong> 
                  {displayBatch.displayFee !== null && displayBatch.displayFee !== undefined
                    ? `₹${displayBatch.displayFee}`
                    : "Not set"}
                </p>
                <p><strong>Capacity:</strong> {displayBatch.capacity}</p>
              </div>
            </>
          )}
        </div>
        <div className="drawer-backdrop" onClick={closeDetail} />
      </div>

      <style jsx>{`
        .singing-page { padding: 2rem; background: #f1f5f9; min-height: 100vh; font-family: system-ui, sans-serif; }
        .page-header h1 { font-size: 2.4rem; font-weight: 800; color: #1e293b; }
        .page-header p { color: #64748b; margin-top: 0.3rem; }
        .tabs-wrapper { background: white; border-radius: 1rem; padding: 0.5rem; margin-bottom: 2rem; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .tabs { display: flex; background: #f3f4f6; border-radius: 9999px; padding: 0.5rem; }
        .tab { flex: 1; padding: 0.75rem; border-radius: 9999px; border: none; font-weight: 600; color: #64748b; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; }
        .tab.active { background: #ea580c; color: white; }
        .main-card { background: white; border-radius: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.1); overflow: hidden; }
        .card-header { padding: 1.5rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e5e7eb; }
        .add-btn { background: #ea580c; color: white; padding: 0.7rem 1.4rem; border-radius: 9999px; border: none; font-weight: 600; cursor: pointer; }
        .search-wrapper { padding: 1rem 2rem; display: flex; align-items: center; gap: 1rem; }
        .search-input { flex: 1; max-width: 500px; padding: 0.75rem 1rem; border-radius: 9999px; border: 1px solid #cbd5e1; }
        .refresh-btn { padding: 0.5rem 1rem; background: #f1f5f9; border-radius: 0.5rem; border: none; }
        .content-area { min-height: 60vh; }
        .list-view { padding: 0 2rem 2rem; }
        .direct-form { padding: 0 2rem 2rem; }
        .data-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .data-table th, .data-table td { padding: 1rem; text-align: left; border-bottom: 1px solid #e5e7eb; }
        .data-table th { background: #f8fafc; font-weight: 600; color: #374151; }
        .clickable { cursor: pointer; color: #ea580c; }
        .clickable:hover { text-decoration: underline; }
        .actions { white-space: nowrap; }
        .mini { padding: 0.35rem 0.75rem; margin: 0 0.25rem; border-radius: 0.375rem; font-size: 0.85rem; border: none; cursor: pointer; }
        .mini.edit { background: #dbeafe; color: #1e40af; }
        .mini.delete { background: #fee2e2; color: #991b1b; }
        .loading, .empty { text-align: center; padding: 4rem; color: #64748b; }
        .empty h3 { margin-bottom: 0.5rem; }
        .error-banner { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 0.5rem; margin: 1rem 2rem; }
        .drawer { position: fixed; inset: 0; pointer-events: none; z-index: 50; }
        .drawer.open { pointer-events: all; }
        .drawer-content { position: absolute; top: 0; right: 0; width: 420px; max-width: 90vw; height: 100%; background: white; box-shadow: -4px 0 20px rgba(0,0,0,0.15); padding: 2rem; overflow-y: auto; transform: translateX(100%); transition: transform 0.3s ease; }
        .drawer.open .drawer-content { transform: translateX(0); }
        .close-btn { position: absolute; top: 1rem; right: 1rem; background: none; border: none; cursor: pointer; color: #64748b; }
        .drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.4); opacity: 0; transition: opacity 0.3s; }
        .drawer.open .drawer-backdrop { opacity: 1; }
        .detail-grid p { margin: 0.75rem 0; font-size: 1rem; }
      `}</style>
    </div>
  );
}

function Tab({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`tab ${active ? "active" : ""}`}>
      {icon}
      <span>{label}</span>
    </button>
  );
}