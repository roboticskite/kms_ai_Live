import { X, Users, Plus, BookOpen, Award, Download, Upload, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { useEditorStore } from "../store/editorStore";
import { downloadJSON, readFileAsText } from "../utils/helpers";

export default function TeacherDashboard({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"classes" | "students" | "assignments" | "challenges">("classes");
  const {
    classes,
    students,
    assignments,
    challenges,
    addClass,
    removeClass,
    addStudent,
    removeStudent,
    addAssignment,
    removeAssignment,
    addChallenge,
    removeChallenge,
    importTeacherData,
  } = useEditorStore();

  const [newClassName, setNewClassName] = useState("");
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState(classes[0]?.name || "");

  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignClass, setAssignClass] = useState(classes[0]?.name || "");
  const [assignDue, setAssignDue] = useState("2026-11-30");

  const [showAddChallengeModal, setShowAddChallengeModal] = useState(false);
  const [chalTitle, setChalTitle] = useState("");
  const [chalDesc, setChalDesc] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateClass = () => {
    if (!newClassName.trim()) return;
    addClass(newClassName.trim());
    setNewClassName("");
  };

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    addStudent(studentName.trim(), studentClass || classes[0]?.name || "General");
    setStudentName("");
    setShowAddStudentModal(false);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;
    addAssignment(assignTitle.trim(), assignClass || classes[0]?.name || "General", assignDue);
    setAssignTitle("");
    setShowAddAssignmentModal(false);
  };

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chalTitle.trim()) return;
    addChallenge(chalTitle.trim(), chalDesc.trim() || "Complete the coding challenge!");
    setChalTitle("");
    setChalDesc("");
    setShowAddChallengeModal(false);
  };

  const handleExportData = () => {
    const data = { classes, students, assignments, challenges };
    downloadJSON(data, "kite_teacher_dashboard_backup.json");
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await readFileAsText(file);
      const parsed = JSON.parse(text);
      importTeacherData(parsed);
      alert("Teacher dashboard data imported successfully!");
    } catch {
      alert("Failed to parse classroom data file.");
    }
    e.target.value = "";
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-kite-50 to-blue-50">
          <div className="flex items-center gap-2">
            <Users size={22} className="text-kite-600" />
            <span className="font-bold text-lg text-gray-800">Teacher Dashboard</span>
            <span className="text-xs font-semibold bg-kite-100 text-kite-700 px-2 py-0.5 rounded-full ml-2">
              Classroom Manager
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-ghost text-xs gap-1 py-1.5 px-2.5 text-gray-600 border border-gray-200"
              onClick={handleExportData}
              title="Export Classroom Backup"
            >
              <Download size={14} /> Export
            </button>
            <button
              className="btn-ghost text-xs gap-1 py-1.5 px-2.5 text-gray-600 border border-gray-200"
              onClick={() => fileInputRef.current?.click()}
              title="Import Classroom Backup"
            >
              <Upload size={14} /> Import
            </button>
            <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImportData} />
            <button className="btn-ghost p-1.5" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50/50">
          {(["classes", "students", "assignments", "challenges"] as const).map((t) => (
            <button
              key={t}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-all ${
                tab === t ? "text-kite-600 border-b-2 border-kite-500 bg-white" : "text-gray-500 hover:text-gray-800"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {tab === "classes" && (
            <div>
              <div className="flex gap-2 mb-5">
                <input
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Enter new class name (e.g. Grade 5 Robotics)..."
                  className="flex-1 px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-kite-400 bg-white"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateClass()}
                />
                <button className="btn-primary gap-1.5" onClick={handleCreateClass}>
                  <Plus size={16} /> Create Class
                </button>
              </div>

              {classes.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  No classes yet. Type a class name above and click Create Class!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all bg-white flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-800 text-base">{c.name}</h3>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {students.filter((s) => s.className === c.name).length} students
                          </span>
                          <span className="bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                            {assignments.filter((a) => a.className === c.name).length} assignments
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-ghost p-1.5 text-gray-400 hover:text-red-500"
                        onClick={() => removeClass(c.id)}
                        title="Delete Class"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "students" && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold text-gray-700">{students.length} Registered Students</div>
                <button className="btn-primary text-xs gap-1 py-1.5 px-3" onClick={() => setShowAddStudentModal(true)}>
                  <Plus size={15} /> Add Student
                </button>
              </div>

              {showAddStudentModal && (
                <form onSubmit={handleCreateStudent} className="mb-5 p-4 rounded-xl border border-kite-200 bg-kite-50 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[180px]">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Student Full Name</label>
                    <input
                      type="text"
                      required
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Maya Patel"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Assigned Class</label>
                    <select
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs py-2 px-3 font-semibold">Save</button>
                    <button type="button" className="btn-ghost text-xs py-2 px-2" onClick={() => setShowAddStudentModal(false)}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">Class</th>
                      <th className="py-3 px-4">Curriculum Progress</th>
                      <th className="py-3 px-4">Projects Built</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {students.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-gray-800">{s.name}</td>
                        <td className="py-3 px-4 text-gray-600">{s.className}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-kite-500 rounded-full" style={{ width: `${s.progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 font-medium">{s.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 font-medium">{s.projects}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => removeStudent(s.id)}
                            title="Remove Student"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "assignments" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-gray-700">{assignments.length} Course Assignments</div>
                <button className="btn-primary text-xs gap-1 py-1.5 px-3" onClick={() => setShowAddAssignmentModal(true)}>
                  <Plus size={15} /> New Assignment
                </button>
              </div>

              {showAddAssignmentModal && (
                <form onSubmit={handleCreateAssignment} className="p-4 rounded-xl border border-kite-200 bg-kite-50 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Assignment Title</label>
                    <input
                      type="text"
                      required
                      value={assignTitle}
                      onChange={(e) => setAssignTitle(e.target.value)}
                      placeholder="e.g. Build an Animated Maze"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    />
                  </div>
                  <div className="w-48">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Class</label>
                    <select
                      value={assignClass}
                      onChange={(e) => setAssignClass(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    >
                      {classes.map((c) => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-36">
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={assignDue}
                      onChange={(e) => setAssignDue(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-xs py-2 px-3 font-semibold">Save</button>
                    <button type="button" className="btn-ghost text-xs py-2 px-2" onClick={() => setShowAddAssignmentModal(false)}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {assignments.map((a) => (
                  <div key={a.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all flex items-center justify-between bg-white">
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <BookOpen size={16} className="text-kite-500" /> {a.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-medium">{a.className} • Due: {a.due}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs font-semibold text-gray-700">{a.submitted}/{a.total} submitted</div>
                        <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${(a.submitted / Math.max(1, a.total)) * 100}%` }} />
                        </div>
                      </div>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeAssignment(a.id)}
                        title="Delete Assignment"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "challenges" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="text-sm font-semibold text-gray-700">{challenges.length} Classroom Challenges</div>
                <button className="btn-primary text-xs gap-1 py-1.5 px-3" onClick={() => setShowAddChallengeModal(true)}>
                  <Plus size={15} /> Create Challenge
                </button>
              </div>

              {showAddChallengeModal && (
                <form onSubmit={handleCreateChallenge} className="p-4 rounded-xl border border-kite-200 bg-kite-50 flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Challenge Title</label>
                    <input
                      type="text"
                      required
                      value={chalTitle}
                      onChange={(e) => setChalTitle(e.target.value)}
                      placeholder="e.g. 5-Block Game Challenge"
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Challenge Description & Rules</label>
                    <textarea
                      rows={2}
                      value={chalDesc}
                      onChange={(e) => setChalDesc(e.target.value)}
                      placeholder="Describe the challenge goals and constraints..."
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white outline-none focus:border-kite-500"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="submit" className="btn-primary text-xs py-2 px-3 font-semibold">Save Challenge</button>
                    <button type="button" className="btn-ghost text-xs py-2 px-2" onClick={() => setShowAddChallengeModal(false)}>Cancel</button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {challenges.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all flex items-center justify-between bg-white">
                    <div>
                      <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <Award size={18} className="text-amber-500" /> {c.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{c.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs bg-amber-50 text-amber-700 font-semibold px-2.5 py-1 rounded-full border border-amber-200">
                        {c.submissions} submissions
                      </span>
                      <button
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => removeChallenge(c.id)}
                        title="Delete Challenge"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
