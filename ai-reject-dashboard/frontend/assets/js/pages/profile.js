function profileConsole() {
  return {
    activeTab: 'info',
    loading: false,
    
    user: { name: 'الموظف', role: '...', avatar: '👤', email: '' },
    profileForm: { name: '', avatar: '👤' },
    passwordForm: { current: '', newPassword: '', confirm: '' },
    twofaSetup: { qrCodeUrl: '', secret: '', token: '' },
    apiTokenForm: { name: '', expiresDays: '30' },
    generatedToken: '',
    
    activeSessions: [],
    apiTokens: [],

    init() {
      this.loadProfile();
    },

    async loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.success && data.data) {
          const d = data.data;
          this.user = d.user;
          this.profileForm.name = d.user.name;
          this.profileForm.avatar = d.user.avatar || '👤';
          this.activeSessions = d.activeSessions || [];
          this.apiTokens = d.apiTokens || [];
        }
      } catch (e) {
        console.error('Failed to load profile:', e);
      }
    },

    async updateProfile() {
      this.loading = true;
      try {
        const res = await fetch('/api/auth/me', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.profileForm)
        });
        const data = await res.json();
        if (res.ok) {
          this.loadProfile();
          alert(this.user.language === 'en' ? 'Profile updated successfully!' : 'تم تحديث البيانات الشخصية بنجاح!');
        } else {
          throw new Error(data.message);
        }
      } catch (err) {
        alert(err.message || 'Failed to update profile');
      } finally {
        this.loading = false;
      }
    },

    async changePassword() {
      if (this.passwordForm.newPassword !== this.passwordForm.confirm) {
        alert('كلمتا المرور الجديدتان غير متطابقتين.');
        return;
      }
      this.loading = true;
      try {
        const res = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: this.passwordForm.current,
            newPassword: this.passwordForm.newPassword
          })
        });
        const data = await res.json();
        if (res.ok) {
          alert('تم تحديث كلمة المرور بنجاح!');
          this.passwordForm = { current: '', newPassword: '', confirm: '' };
        } else {
          throw new Error(data.message);
        }
      } catch (e) {
        alert(e.message || 'Failed to change password');
      } finally {
        this.loading = false;
      }
    },

    async setup2FA() {
      this.loading = true;
      try {
        const res = await fetch('/api/auth/2fa/setup', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.data) {
          this.twofaSetup.qrCodeUrl = data.data.qrCodeUrl;
          this.twofaSetup.secret = data.data.secret;
        }
      } catch (e) {
        alert('Failed to setup 2FA');
      } finally {
        this.loading = false;
      }
    },

    async confirm2FA() {
      this.loading = true;
      try {
        const res = await fetch('/api/auth/2fa/enable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: this.twofaSetup.token })
        });
        const data = await res.json();
        if (res.ok) {
          this.user.two_factor_enabled = 1;
          this.twofaSetup = { qrCodeUrl: '', secret: '', token: '' };
          alert('تم تفعيل التحقق الثنائي (2FA) بنجاح!');
        } else {
          throw new Error(data.message);
        }
      } catch (e) {
        alert(e.message || 'Failed to confirm 2FA');
      } finally {
        this.loading = false;
      }
    },

    async disable2FA(password) {
      this.loading = true;
      try {
        const res = await fetch('/api/auth/2fa/disable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        const data = await res.json();
        if (res.ok) {
          this.user.two_factor_enabled = 0;
          alert('تم إلغاء تفعيل التحقق الثنائي (2FA) لحسابك.');
        } else {
          throw new Error(data.message);
        }
      } catch (e) {
        alert(e.message || 'Failed to disable 2FA');
      } finally {
        this.loading = false;
      }
    },

    async revokeSession(sessionId) {
      if (!confirm('هل أنت متأكد من إنهاء جلسة هذا الجهاز؟')) return;
      try {
        const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
        if (res.ok) {
          this.loadProfile();
        }
      } catch (e) {
        alert('Failed to revoke session');
      }
    },

    async revokeAllSessions() {
      if (!confirm('هل أنت متأكد من فرض تسجيل الخروج لكافة الأجهزة والاتصالات النشطة حالياً؟')) return;
      try {
        const res = await fetch('/api/auth/logout', { method: 'POST' });
        if (res.ok) {
          window.location.href = '/pages/login.html';
        }
      } catch (e) {
        alert('Failed to logout');
      }
    },

    async generateApiToken() {
      this.loading = true;
      this.generatedToken = '';
      try {
        const res = await fetch('/api/auth/api-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.apiTokenForm.name,
            expiresDays: this.apiTokenForm.expiresDays ? Number(this.apiTokenForm.expiresDays) : null
          })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          this.generatedToken = data.token;
          this.apiTokenForm = { name: '', expiresDays: '30' };
          this.loadProfile();
        } else {
          throw new Error(data.message);
        }
      } catch (e) {
        alert(e.message || 'Failed to generate API token');
      } finally {
        this.loading = false;
      }
    },

    async revokeApiToken(tokenId) {
      if (!confirm('هل أنت متأكد من إبطال مفتاح التكامل هذا بشكل نهائي؟ سيتوقف أي ربط خارجي يستعمله فوراً.')) return;
      try {
        const res = await fetch(`/api/auth/sessions/${tokenId}`, { method: 'DELETE' });
        if (res.ok) {
          this.loadProfile();
        }
      } catch (e) {
        alert('Failed to revoke API Token');
      }
    }
  };
}
