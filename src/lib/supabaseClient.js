import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Biến môi trường VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình.\n' +
    'Ứng dụng sẽ chạy ở chế độ DEMO với dữ liệu mẫu (Mock Data).'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

/**
 * Kiem tra xem Supabase co duoc cau hinh hay khong
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

/**
 * Lay thong tin profile (bao gom role) cua user hien tai
 * Su dung sau khi dang nhap de xac dinh quyen
 */
export async function getUserProfile() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('id, user_id, full_name, email, role, department_id, employee_id, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('[Auth] Khong the lay profile:', error.message)
    return null
  }

  return data
}

/**
 * Dang nhap bang email va password
 */
export async function signInWithEmail(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/**
 * Dang ky tai khoan moi
 */
export async function signUpWithEmail(email, password, metadata = {}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: metadata },
  })
  if (error) throw error
  return data
}

// Log trang thai khoi tao
if (isSupabaseConfigured) {
  console.log('[Database] Đang kết nối tới Supabase: ', supabaseUrl.split('//')[1].split('.')[0])

  supabase.from('profiles').select('id', { count: 'exact', head: true })
    .then(({ error }) => {
      if (error) {
        console.error('[Database] Kết nối thất bại (có thể bảng profiles chưa tồn tại):', error.message)
      } else {
        console.log('[Database] Kết nối thành công tới Supabase. Database đã sẵn sàng.')
      }
    })
} else {
  console.log('[Database] Chế độ DEMO: Đang sử dụng dữ liệu cục bộ.')
}
