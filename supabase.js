// ========== SUPABASE МОДУЛЬ ==========
const SupabaseModule = (function() {
    const SUPABASE_URL = 'https://rhjaoewcnbuzfinkioji.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamFvZXdjbmJ1emZpbmtpb2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNzU5ODQsImV4cCI6MjA5NDc1MTk4NH0.xMjuIbeLi_MJ6dsoMyrFVZCBy8BGQsIutIVpeKqjXSk';
    
    let sb = null;
    
    function init() {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return sb;
    }
    
    function getClient() {
        if (!sb) init();
        return sb;
    }
    
    async function loadTeacher(login) {
        const { data, error } = await getClient().from('teachers').select('*').eq('login', login).single();
        if (error && error.code !== 'PGRST116') return null;
        return data;
    }
    
    async function createTeacher(login, name) {
        const id = Date.now().toString();
        const { data, error } = await getClient().from('teachers').insert([{ id, login, name }]).select().single();
        if (error) return null;
        return data;
    }
    
    async function loadClasses(teacherId) {
        const { data, error } = await getClient().from('classes').select('*').eq('teacher_id', teacherId).order('created_at', { ascending: true });
        if (error) return [];
        return data || [];
    }
    
    async function createClass(teacherId, className, classCode) {
        const id = Date.now().toString();
        const { data, error } = await getClient().from('classes').insert([{ id, teacher_id: teacherId, class_name: className, class_code: classCode }]).select().single();
        if (error) return null;
        return data;
    }
    
    async function deleteClass(classId) {
        const { error } = await getClient().from('classes').delete().eq('id', classId);
        if (error) return false;
        return true;
    }
    
    async function loadStudents(classId) {
        const { data, error } = await getClient().from('students').select('*').eq('class_id', classId).order('created_at', { ascending: true });
        if (error) return [];
        return (data || []).map(s => ({ ...s, scaleResults: s.scale_results || null, results: s.results || [] }));
    }
    
    async function saveStudentResults(student) {
        const { error } = await getClient().from('students').upsert({
            id: student.id, teacher_id: student.teacher_id, class_id: student.class_id,
            name: student.name, class_code: student.class_code, completed: student.completed,
            risk_level: student.riskLevel, overall_risk: student.overallRiskPercent,
            scale_results: student.scaleResults, date: student.date, results: student.results,
            ai_report_html: student.ai_report_html, ai_raw_data: student.ai_raw_data
        });
        if (error) return false;
        return true;
    }
    
    async function findOrCreateStudent(name, classCode, classId, teacherId) {
        const { data: existing } = await getClient().from('students').select('*').eq('name', name).eq('class_id', classId).maybeSingle();
        if (existing) return { ...existing, scaleResults: existing.scale_results, results: existing.results || [] };
        const id = Date.now().toString();
        const newStudent = { id, teacher_id: teacherId, class_id: classId, name, class_code: classCode, completed: false, risk_level: null, overall_risk: null, scale_results: null, date: null, results: [], ai_report_html: null, ai_raw_data: null };
        const { error } = await getClient().from('students').insert([newStudent]);
        if (error) return null;
        return { ...newStudent, scaleResults: null, results: [] };
    }
    
    async function findClassByCode(classCode) {
        const { data, error } = await getClient().from('classes').select('*').eq('class_code', classCode).maybeSingle();
        if (error || !data) return null;
        return { ...data, teacherId: data.teacher_id };
    }
    
    function generateRandomCode() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
        return code;
    }
    
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, function(m) {
            if (m === '&') return '&amp;';
            if (m === '<') return '&lt;';
            if (m === '>') return '&gt;';
            return m;
        });
    }
    
    return {
        init,
        getClient,
        loadTeacher,
        createTeacher,
        loadClasses,
        createClass,
        deleteClass,
        loadStudents,
        saveStudentResults,
        findOrCreateStudent,
        findClassByCode,
        generateRandomCode,
        escapeHtml
    };
})();