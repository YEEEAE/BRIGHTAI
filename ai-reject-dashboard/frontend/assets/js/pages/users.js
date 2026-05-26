function adminApp() {
  return {
    activeView: 'users',
    modalOpen: false,
    isEdit: false,
    loading: false,
    
    usersList: [],
    auditLogsList: [],
    rolesList: [],
    
    filters: { search: '', status: '', role: '' },
    auditFilters: { search: '', action: '', status: '' },
    
    userForm: { id: '', name: '', email: '', password: '', roleName: 'Viewer', status: 'active' },

    init() {
      this.loadUsers();
      this.loadAuditLogs();
      this.loadRoles();
    },

    async loadUsers() {
      try {
        const query = new URLSearchParams(this.filters).toString();
        const res = await fetch(`/api/admin/users?${query}`);
        const data = await res.json();
        if (data.success) {
          this.usersList = data.data;
        }
      } catch (e) {
        console.error('Failed to load users:', e);
      }
    },

    async loadAuditLogs() {
      try {
        const query = new URLSearchParams(this.auditFilters).toString();
        const res = await fetch(`/api/admin/audit-log?${query}`);
        const data = await res.json();
        if (data.success) {
          this.auditLogsList = data.data;
        }
      } catch (e) {
        console.error('Failed to load audit logs:', e);
      }
    },

    async loadRoles() {
      try {
        const res = await fetch('/api/admin/roles');
        const data = await res.json();
        if (data.success) {
          this.rolesList = data.data;
        }
      } catch (e) {
        console.error('Failed to load roles:', e);
      }
    },

    openAddModal() {
      this.isEdit = false;
      this.userForm = { id: '', name: '', email: '', password: '', roleName: 'Viewer', status: 'active' };
      this.modalOpen = true;
    },

    openEditModal(u) {
      this.isEdit = true;
      this.userForm = { 
        id: u.id, 
        name: u.name, 
        email: u.email, 
        password: '', 
        roleName: u.role_name || 'Viewer', 
        status: u.status 
      };
      this.modalOpen = true;
    },

    async saveUser() {
      this.loading = true;
      const url = this.isEdit ? `/api/admin/users/${this.userForm.id}` : '/api/admin/users';
      const method = this.isEdit ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method: method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.userForm)
        });

        const data = await res.json();

        if (res.ok) {
          this.modalOpen = false;
          this.loadUsers();
          this.loadAuditLogs();
          alert(this.isEdit ? 'تم تحديث بيانات الموظف وصلاحياته بنجاح!' : 'تمت إضافة الموظف بنجاح وتوليد وتأمين الحساب!');
        } else {
          throw new Error(data.message || 'Failed to save user');
        }
      } catch (err) {
        alert(err.message);
      } finally {
        this.loading = false;
      }
    },

    async deactivateUser(userId) {
      if (!confirm('هل أنت متأكد من حظر وتعطيل حساب هذا الموظف؟ سيتم إنهاء كافة جلساته النشطة فوراً ومنعه من تسجيل الدخول.')) return;
      
      try {
        const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
        if (res.ok) {
          this.loadUsers();
          this.loadAuditLogs();
          alert('تم حظر الموظف وتعطيل الحساب بنجاح.');
        }
      } catch (e) {
        alert('Failed to deactivate user');
      }
    },

    async resetUserPassword(userId) {
      if (!confirm('هل أنت متأكد من تصفير كلمة مرور هذا الموظف ووضع كلمة مرور عشوائية جديدة؟')) return;
      
      try {
        const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' });
        const data = await res.json();
        
        if (res.ok && data.tempPassword) {
          this.loadAuditLogs();
          alert(`تم تصفير كلمة المرور بنجاح!\n\nكلمة المرور المؤقتة الجديدة هي:\n${data.tempPassword}\n\nيرجى نسخها وتزويد الموظف بها الآن.`);
        } else {
          throw new Error(data.message);
        }
      } catch (e) {
        alert(e.message || 'Failed to reset password');
      }
    }
  };
}
