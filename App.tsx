/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserRound, 
  Calendar, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronLeft, 
  LayoutDashboard, 
  History, 
  Download, 
  MessageSquare,
  Lock,
  LogOut,
  Search,
  Filter,
  Plus,
  Settings,
  Trash2,
  ListTodo
} from 'lucide-react';
import { STUDENTS, STATUS_CONFIG, TEACHER_PIN } from './constants';
import { HomeworkStatus, HomeworkRecord, ViewMode, Student, HomeworkItem } from './types';

// --- Utilities ---
const getTodayStr = () => new Date().toISOString().split('T')[0];

const saveToLocal = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const getFromLocal = (key: string) => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
};

export default function App() {
  // --- State ---
  const [view, setView] = useState<ViewMode>("HOME");
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [records, setRecords] = useState<HomeworkRecord[]>([]);
  const [homeworkItems, setHomeworkItems] = useState<HomeworkItem[]>([
    { id: '1', name: '國語習作' },
    { id: '2', name: '數學考卷' },
    { id: '3', name: '英語作業' }
  ]);
  const [currentHomework, setCurrentHomework] = useState("國語習作");
  const [currentDate, setCurrentDate] = useState(getTodayStr());
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState(false);

  // Temporary state for group entry
  const [entryStatus, setEntryStatus] = useState<Record<number, HomeworkStatus>>({});

  // --- Initialization ---
  useEffect(() => {
    const savedRecords = getFromLocal("homework_records");
    if (savedRecords) setRecords(savedRecords);
    
    const savedItems = getFromLocal("homework_items");
    if (savedItems) setHomeworkItems(savedItems);
  }, []);

  useEffect(() => {
    saveToLocal("homework_records", records);
  }, [records]);

  useEffect(() => {
    saveToLocal("homework_items", homeworkItems);
  }, [homeworkItems]);

  // --- Handlers ---
  const handleGroupSelect = (group: number) => {
    setSelectedGroup(group);
    const groupStudents = STUDENTS.filter(s => s.group === group);
    const initialStatus: Record<number, HomeworkStatus> = {};
    groupStudents.forEach(s => {
      initialStatus[s.id] = HomeworkStatus.SUBMITTED;
    });
    setEntryStatus(initialStatus);
    setView("GROUP_ENTRY");
  };

  const handleStatusChange = (studentId: number, status: HomeworkStatus) => {
    setEntryStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitRecords = () => {
    if (!currentHomework.trim()) {
      alert("請輸入作業名稱");
      return;
    }

    const newRecords: HomeworkRecord[] = Object.entries(entryStatus).map(([studentId, status]) => ({
      id: `${currentDate}-${currentHomework}-${studentId}-${Date.now()}`,
      date: currentDate,
      homeworkName: currentHomework,
      studentId: parseInt(studentId),
      status: status as HomeworkStatus,
      updatedAt: Date.now()
    }));

    setRecords(prev => [...prev, ...newRecords]);
    alert("紀錄已送出！");
    setView("HOME");
    setSelectedGroup(null);
  };

  const handleTeacherLogin = () => {
    if (pinInput === TEACHER_PIN) {
      setView("TEACHER_DASHBOARD");
      setPinInput("");
      setLoginError(false);
    } else {
      setLoginError(true);
      setPinInput("");
    }
  };

  const exportToCSV = () => {
    if (records.length === 0) return;
    
    const headers = ["日期", "作業名稱", "座號", "姓名", "狀態"];
    const rows = records.map(r => {
      const student = STUDENTS.find(s => s.id === r.studentId);
      return [
        r.date,
        r.homeworkName,
        student?.id || "",
        student?.name || "",
        STATUS_CONFIG[r.status].label
      ];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `作業紀錄_${getTodayStr()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteRecord = (id: string) => {
    if (confirm("確定要刪除這筆紀錄嗎？")) {
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  const addHomeworkItem = (name: string) => {
    if (!name.trim()) return;
    const newItem: HomeworkItem = {
      id: Date.now().toString(),
      name: name.trim()
    };
    setHomeworkItems(prev => [...prev, newItem]);
  };

  const removeHomeworkItem = (id: string) => {
    setHomeworkItems(prev => prev.filter(item => item.id !== id));
  };

  // --- Computed Data ---
  const dashboardStats = useMemo(() => {
    const todayRecords = records.filter(r => r.date === getTodayStr());
    const totalStudents = STUDENTS.length;
    const submittedCount = todayRecords.filter(r => r.status === HomeworkStatus.SUBMITTED || r.status === HomeworkStatus.CORRECTED).length;
    const missingCount = todayRecords.filter(r => r.status === HomeworkStatus.MISSING).length;
    
    return {
      progress: todayRecords.length > 0 ? Math.round((submittedCount / todayRecords.length) * 100) : 0,
      missingCount,
      totalToday: todayRecords.length
    };
  }, [records]);

  const warningList = useMemo(() => {
    // Students with 3+ missing in the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentMissing = records.filter(r => 
      r.status === HomeworkStatus.MISSING && 
      new Date(r.date) >= sevenDaysAgo
    );

    const counts: Record<number, number> = {};
    recentMissing.forEach(r => {
      counts[r.studentId] = (counts[r.studentId] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count >= 3)
      .map(([id, count]) => ({
        student: STUDENTS.find(s => s.id === parseInt(id))!,
        count
      }));
  }, [records]);

  const generateNotification = (student: Student) => {
    const missing = records.filter(r => r.studentId === student.id && r.status === HomeworkStatus.MISSING);
    const text = `【作業缺交通知】\n家長您好，${student.name} 同學近期有以下作業尚未繳交：\n${missing.map(m => `- ${m.date} ${m.homeworkName}`).join('\n')}\n請協助督促孩子完成，謝謝。`;
    navigator.clipboard.writeText(text);
    alert("通知文案已複製到剪貼簿！");
  };

  // --- Views ---

  const HomeView = () => (
    <div className="max-w-4xl mx-auto p-6 space-y-12">
      <header className="text-center space-y-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-block p-4 bg-emerald-100 rounded-full text-emerald-600 mb-2"
        >
          <BookOpen size={48} />
        </motion.div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900">五年級作業追蹤系統</h1>
        <p className="text-slate-500 text-lg">請選擇您的身份或小組開始登記</p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(g => (
          <motion.button
            key={g}
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleGroupSelect(g)}
            className="glass-card p-8 rounded-3xl flex flex-col items-center justify-center space-y-4 btn-hover group"
          >
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Users size={32} />
            </div>
            <span className="text-xl font-bold">第 {g} 組</span>
          </motion.button>
        ))}
      </div>

      <div className="pt-8 border-t border-slate-200 flex justify-center">
        <button 
          onClick={() => setView("TEACHER_LOGIN")}
          className="flex items-center space-x-2 text-slate-500 hover:text-emerald-600 transition-colors font-medium"
        >
          <Lock size={18} />
          <span>導師管理後台</span>
        </button>
      </div>
    </div>
  );

  const GroupEntryView = () => {
    const groupStudents = STUDENTS.filter(s => s.group === selectedGroup);
    
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("HOME")} className="flex items-center text-slate-500 hover:text-slate-900 font-medium">
            <ChevronLeft size={20} />
            <span>返回</span>
          </button>
          <h2 className="text-2xl font-bold">第 {selectedGroup} 組登記</h2>
          <div className="w-10" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <Calendar size={16} /> 登記日期
            </label>
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="w-full p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium"
            />
          </div>
          <div className="glass-card p-4 rounded-2xl space-y-2">
            <label className="text-sm font-bold text-slate-500 flex items-center gap-2">
              <BookOpen size={16} /> 作業項目
            </label>
            <div className="flex gap-2">
              <select 
                value={currentHomework}
                onChange={(e) => setCurrentHomework(e.target.value)}
                className="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium appearance-none"
              >
                {homeworkItems.map(item => (
                  <option key={item.id} value={item.name}>{item.name}</option>
                ))}
                <option value="custom">+ 新增項目...</option>
              </select>
              {currentHomework === "custom" && (
                <input 
                  type="text" 
                  placeholder="輸入新作業名稱"
                  autoFocus
                  onBlur={(e) => {
                    if (e.target.value) {
                      setCurrentHomework(e.target.value);
                    } else {
                      setCurrentHomework(homeworkItems[0]?.name || "");
                    }
                  }}
                  className="flex-1 p-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500 text-lg font-medium"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {groupStudents.map(student => (
            <motion.div 
              key={student.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="glass-card p-6 rounded-3xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold">
                    {student.id}
                  </div>
                  <span className="text-xl font-bold">{student.name}</span>
                </div>
                <div className="text-sm font-bold px-3 py-1 bg-slate-100 rounded-full text-slate-500">
                  {STATUS_CONFIG[entryStatus[student.id] || HomeworkStatus.SUBMITTED].label}
                </div>
              </div>
              
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(student.id, status as HomeworkStatus)}
                    className={`p-3 rounded-xl text-sm font-bold btn-hover ${
                      entryStatus[student.id] === status 
                        ? `${config.color} ${config.text} shadow-lg scale-105` 
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {config.label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <button 
          onClick={handleSubmitRecords}
          className="w-full py-5 bg-emerald-600 text-white rounded-3xl text-xl font-bold shadow-xl shadow-emerald-200 btn-hover flex items-center justify-center space-x-2"
        >
          <CheckCircle2 size={24} />
          <span>送出今日紀錄</span>
        </button>
      </div>
    );
  };

  const TeacherLoginView = () => (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-10 rounded-[2.5rem] w-full max-w-md space-y-8 text-center"
      >
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl mx-auto flex items-center justify-center">
          <Lock size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold">導師身分驗證</h2>
          <p className="text-slate-500">請輸入管理 PIN 碼 (預設: 1234)</p>
        </div>
        
        <div className="space-y-4">
          <input 
            type="password" 
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="••••"
            className={`w-full text-center text-4xl tracking-[1em] p-4 bg-slate-50 rounded-2xl border-2 transition-all ${
              loginError ? "border-rose-500 bg-rose-50" : "border-transparent focus:border-emerald-500"
            }`}
          />
          {loginError && <p className="text-rose-500 font-bold">PIN 碼錯誤，請再試一次</p>}
          <button 
            onClick={handleTeacherLogin}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-lg font-bold btn-hover"
          >
            進入管理後台
          </button>
          <button onClick={() => setView("HOME")} className="text-slate-400 font-medium hover:text-slate-600">
            返回首頁
          </button>
        </div>
      </motion.div>
    </div>
  );

  const TeacherDashboardView = () => {
    const [filterDate, setFilterDate] = useState("");
    const [filterName, setFilterName] = useState("");

    const filteredRecords = records.filter(r => {
      const student = STUDENTS.find(s => s.id === r.studentId);
      const matchesDate = filterDate ? r.date === filterDate : true;
      const matchesName = filterName ? student?.name.includes(filterName) : true;
      return matchesDate && matchesName;
    }).sort((a, b) => b.updatedAt - a.updatedAt);

    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <LayoutDashboard className="text-emerald-600" />
              導師管理儀表板
            </h2>
            <p className="text-slate-500 font-medium">歡迎回來，導師。這是全班的作業概況。</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setView("TEACHER_HOMEWORK_MGMT")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
            >
              <Settings size={18} /> 管理作業
            </button>
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
            >
              <Download size={18} /> 匯出 CSV
            </button>
            <button 
              onClick={() => setView("HOME")}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              <LogOut size={18} /> 登出
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">今日繳交進度</h3>
            <div className="flex items-end justify-between">
              <span className="text-4xl font-bold">{dashboardStats.progress}%</span>
              <span className="text-slate-400 font-medium">{dashboardStats.totalToday} 筆紀錄</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${dashboardStats.progress}%` }}
                className="h-full bg-emerald-500"
              />
            </div>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">今日缺交人數</h3>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold text-rose-500">{dashboardStats.missingCount}</span>
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <XCircle size={24} />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">請及時聯絡家長督促</p>
          </div>

          <div className="glass-card p-6 rounded-3xl space-y-4">
            <h3 className="text-slate-500 font-bold text-sm uppercase tracking-wider">全班總人數</h3>
            <div className="flex items-center justify-between">
              <span className="text-4xl font-bold">{STUDENTS.length}</span>
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <UserRound size={24} />
              </div>
            </div>
            <p className="text-slate-400 text-sm font-medium">5 年級班級名單</p>
          </div>
        </div>

        {/* Warnings */}
        {warningList.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-rose-600">
              <AlertCircle size={24} />
              本週預警名單 (缺交 3 次以上)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {warningList.map(({ student, count }) => (
                <motion.div 
                  key={student.id}
                  whileHover={{ scale: 1.02 }}
                  className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center font-bold text-lg">
                      {student.id}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{student.name}</p>
                      <p className="text-rose-600 text-sm font-bold">本週缺交 {count} 次</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => generateNotification(student)}
                    className="p-3 bg-white text-rose-600 rounded-2xl shadow-sm hover:shadow-md transition-all"
                    title="產生家長通知"
                  >
                    <MessageSquare size={20} />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* History Table */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="text-2xl font-bold flex items-center gap-2">
              <History size={24} />
              歷史繳交紀錄
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="搜尋學生姓名..."
                  value={filterName}
                  onChange={(e) => setFilterName(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="glass-card rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">日期</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">作業項目</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">學生</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider">狀態</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-500 uppercase tracking-wider text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.length > 0 ? filteredRecords.map(record => {
                    const student = STUDENTS.find(s => s.id === record.studentId);
                    const config = STATUS_CONFIG[record.status];
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-600">{record.date}</td>
                        <td className="px-6 py-4 font-bold">{record.homeworkName}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{student?.id}</span>
                            <span className="font-bold">{student?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.color} ${config.text}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-medium">
                        目前沒有符合條件的紀錄
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const TeacherHomeworkMgmtView = () => {
    const [newItemName, setNewItemName] = useState("");

    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <button onClick={() => setView("TEACHER_DASHBOARD")} className="flex items-center text-slate-500 hover:text-slate-900 font-medium">
            <ChevronLeft size={20} />
            <span>返回儀表板</span>
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ListTodo className="text-indigo-600" />
            作業項目管理
          </h2>
          <div className="w-10" />
        </div>

        <div className="glass-card p-6 rounded-3xl space-y-6">
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="輸入新作業名稱 (例如：數學考卷)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  addHomeworkItem(newItemName);
                  setNewItemName("");
                }
              }}
              className="flex-1 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500 text-lg font-medium"
            />
            <button 
              onClick={() => {
                addHomeworkItem(newItemName);
                setNewItemName("");
              }}
              className="px-6 bg-indigo-600 text-white rounded-2xl font-bold btn-hover flex items-center gap-2"
            >
              <Plus size={20} /> 新增
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-2">現有作業列表</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {homeworkItems.map(item => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group"
                >
                  <span className="font-bold text-slate-700">{item.name}</span>
                  <button 
                    onClick={() => removeHomeworkItem(item.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-2">
          <h4 className="font-bold text-indigo-900 flex items-center gap-2">
            <AlertCircle size={18} /> 提示
          </h4>
          <p className="text-indigo-700 text-sm leading-relaxed">
            在這裡新增的作業項目會出現在作業長的登記選單中。這可以幫助作業長更快速地完成登記，並減少手動輸入錯誤。
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen font-sans">
      <AnimatePresence mode="wait">
        <motion.main
          key={view}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {view === "HOME" && <HomeView />}
          {view === "GROUP_ENTRY" && <GroupEntryView />}
          {view === "TEACHER_LOGIN" && <TeacherLoginView />}
          {view === "TEACHER_DASHBOARD" && <TeacherDashboardView />}
          {view === "TEACHER_HOMEWORK_MGMT" && <TeacherHomeworkMgmtView />}
        </motion.main>
      </AnimatePresence>
      
      <footer className="py-10 text-center text-slate-400 text-sm font-medium">
        © 2026 五年級班級作業管理系統 · 專業全端開發
      </footer>
    </div>
  );
}
