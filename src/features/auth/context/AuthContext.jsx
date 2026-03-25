import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { ROLES } from '@/constants/roles'
import { logAuditEvent, AUDIT_ACTIONS } from '@/services/auditService'

const AuthContext = createContext()

// Mock profiles cho DEMO MODE
const MOCK_PROFILES = {
  [ROLES.ADMIN]: {
    id: 'admin-123',
    full_name: 'Quản trị viên Hệ thống',
    email: 'admin@peoplehub.vn',
    role: ROLES.ADMIN,
    employee_id: 'PH-ADMIN-01',
    avatar_url: null,
  },
  [ROLES.HR]: {
    id: 'hr-123',
    full_name: 'Trần Thị Nhân Sự',
    email: 'hr@peoplehub.vn',
    role: ROLES.HR,
    employee_id: 'PH-HR-01',
    avatar_url: null,
  },
  [ROLES.MANAGER]: {
    id: 'mgr-123',
    full_name: 'Lê Văn Quản Lý',
    email: 'manager@peoplehub.vn',
    role: ROLES.MANAGER,
    employee_id: 'PH-MGR-01',
    department_id: '1', // Engineering
    avatar_url: null,
  },
  [ROLES.EMPLOYEE]: {
    id: 'emp-123',
    full_name: 'Nguyễn Văn Nhân Viên',
    email: 'employee@peoplehub.vn',
    role: ROLES.EMPLOYEE,
    employee_id: 'PH-EMP-99',
    avatar_url: null,
  },
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [role, setRole] = useState(ROLES.EMPLOYEE)
  const [loading, setLoading] = useState(true)

  // Fetch profile của user dựa trên UID
  const fetchUserProfile = async (userId) => {
    try {
      if (!isSupabaseConfigured) {
        // DEMO MODE logic
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Lỗi khi lấy hồ sơ:', error.message)
        return
      }

      setProfile(data)
      setRole(data?.role || ROLES.EMPLOYEE)
    } catch (err) {
      console.error('Lỗi AuthContext:', err.message)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Logic cho DEMO MODE
      const mockUser = { id: 'demo-user', email: 'admin@peoplehub.vn' }
      setUser(mockUser)
      setProfile(MOCK_PROFILES[ROLES.ADMIN])
      setRole(ROLES.ADMIN)
      setLoading(false)
      return
    }

    // Checking current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
        if (event === 'SIGNED_IN') {
          logAuditEvent({ action: AUDIT_ACTIONS.LOGIN, tableName: 'auth.users' })
        }
      } else {
        setProfile(null)
        setRole(ROLES.EMPLOYEE)
        if (event === 'SIGNED_OUT') {
           // SIGNED_OUT log is handled in signOut function or here if external
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper function để switch role nhanh trong DEMO MODE
  const switchMockRole = (newRole) => {
    if (isSupabaseConfigured) return
    setRole(newRole)
    setProfile(MOCK_PROFILES[newRole])
  }

  const signOut = async () => {
    if (isSupabaseConfigured) {
      logAuditEvent({ action: AUDIT_ACTIONS.LOGOUT, tableName: 'auth.users' })
      await supabase.auth.signOut()
    } else {
      setUser(null)
      setProfile(null)
    }
  }

  const value = {
    user,
    profile,
    role,
    loading,
    signOut,
    switchMockRole,
    isAdmin: role === ROLES.ADMIN,
    isHR: role === ROLES.HR,
    isManager: role === ROLES.MANAGER,
    isEmployee: role === ROLES.EMPLOYEE,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
