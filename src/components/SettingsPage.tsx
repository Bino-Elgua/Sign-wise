import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
} from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp, collection, getCountFromServer } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

// ── helpers ──
function isPasswordUser(user: any): boolean {
  return user.providerData?.some((p: any) => p.providerId === 'password');
}

function formatDate(ts: any): string {
  if (!ts) return '—';
  const date = ts?.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Profile
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwSaving, setPwSaving] = useState(false);

  // Account info
  const [memberSince, setMemberSince] = useState<string>('');
  const [totalDocs, setTotalDocs] = useState<number>(0);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const data = userSnap.data();
        setMemberSince(formatDate(data.createdAt));
      }
      const docsCol = collection(db, 'users', user.uid, 'documents');
      const countSnap = await getCountFromServer(docsCol);
      setTotalDocs(countSnap.data().count);
    })();
  }, [user]);

  if (!user) return null;

  const initials = (displayName || user.email || 'U')
    .split(/[\s@]+/)
    .map((w: string) => w[0]?.toUpperCase())
    .slice(0, 2)
    .join('');

  // ── Save display name ──
  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp(),
      });
      setSaveMsg('Profile updated.');
    } catch (err: any) {
      setSaveMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Change password ──
  const handleChangePassword = async () => {
    if (!currentPw || !newPw || newPw.length < 6) {
      setPwMsg('New password must be at least 6 characters.');
      return;
    }
    setPwSaving(true);
    setPwMsg(null);
    try {
      const cred = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg('Password changed successfully.');
      setCurrentPw('');
      setNewPw('');
    } catch (err: any) {
      setPwMsg(err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : err.message);
    } finally {
      setPwSaving(false);
    }
  };

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // 1. Cloud Function: Firestore docs + Storage files
      const deleteAccount = httpsCallable(functions, 'deleteUserAccount');
      await deleteAccount({});

      // 2. Delete Auth user (client-side)
      await deleteUser(user);

      // 3. Sign out + redirect
      await signOut();
      navigate('/login');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setDeleteError('Please sign out and sign back in, then try again (recent login required).');
      } else {
        setDeleteError(err.message || 'Failed to delete account.');
      }
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">Settings.</h1>
      </div>

      {/* ═══ PROFILE ═══ */}
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-10 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3">
          <i className="fa-solid fa-user text-indigo-600"></i> Profile
        </h3>

        {/* Avatar + email */}
        <div className="flex items-center gap-5">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-16 h-16 rounded-[1.5rem] border-2 border-slate-100 object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white text-xl font-black">
              {initials}
            </div>
          )}
          <div>
            <p className="text-base font-black text-slate-900">{user.displayName || 'No name set'}</p>
            <p className="text-xs text-slate-400 font-bold">{user.email}</p>
            {!isPasswordUser(user) && (
              <span className="inline-block mt-1 px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-lg">
                <i className="fa-brands fa-google mr-1"></i> Signed in with Google
              </span>
            )}
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Display Name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={handleSaveProfile}
              disabled={saving || !displayName.trim()}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? <i className="fa-solid fa-spinner animate-spin"></i> : 'Save'}
            </button>
          </div>
          {saveMsg && (
            <p className={`text-[10px] font-bold mt-2 ${saveMsg.includes('updated') ? 'text-emerald-600' : 'text-red-500'}`}>{saveMsg}</p>
          )}
        </div>

        {/* Password change (email/password users only) */}
        {isPasswordUser(user) && (
          <div className="pt-4 border-t border-slate-50 space-y-3">
            <h4 className="text-[9px] font-black uppercase tracking-widest text-slate-400">Change Password</h4>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="Current password"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={handleChangePassword}
              disabled={pwSaving || !currentPw || !newPw}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition disabled:opacity-50"
            >
              {pwSaving ? <><i className="fa-solid fa-spinner animate-spin mr-1"></i> Updating</> : 'Update Password'}
            </button>
            {pwMsg && (
              <p className={`text-[10px] font-bold ${pwMsg.includes('success') ? 'text-emerald-600' : 'text-red-500'}`}>{pwMsg}</p>
            )}
          </div>
        )}
      </section>

      {/* ═══ ACCOUNT INFO ═══ */}
      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-10">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-3 mb-6">
          <i className="fa-solid fa-id-card text-indigo-600"></i> Account
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan</p>
            <p className="text-lg font-black text-indigo-600">Free</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Member Since</p>
            <p className="text-sm font-black text-slate-900">{memberSince}</p>
          </div>
          <div className="bg-slate-50 p-5 rounded-[1.5rem] border border-slate-100">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Documents</p>
            <p className="text-lg font-black text-slate-900">{totalDocs}</p>
          </div>
        </div>
      </section>

      {/* ═══ DANGER ZONE ═══ */}
      <section className="bg-red-50 rounded-[2rem] border border-red-200 p-8 md:p-10 space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-700 flex items-center gap-3">
          <i className="fa-solid fa-skull-crossbones"></i> Danger Zone
        </h3>
        <p className="text-sm text-red-600 font-medium leading-relaxed">
          This permanently deletes your account, all uploaded documents, and all analysis data. This action cannot be undone.
        </p>
        <div>
          <label className="text-[9px] font-black uppercase tracking-widest text-red-500 mb-2 block">
            Type <span className="font-mono bg-red-100 px-2 py-0.5 rounded">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="DELETE"
            className="w-full bg-white border border-red-200 rounded-xl px-5 py-3 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-red-500/20 mb-4"
          />
          <button
            onClick={handleDeleteAccount}
            disabled={deleteConfirm !== 'DELETE' || deleting}
            className="bg-red-600 text-white px-10 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {deleting ? (
              <><i className="fa-solid fa-spinner animate-spin"></i> Deleting Account...</>
            ) : (
              <><i className="fa-solid fa-trash"></i> Delete My Account</>
            )}
          </button>
          {deleteError && (
            <p className="text-[10px] font-bold text-red-600 mt-3">{deleteError}</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;
