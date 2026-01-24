# Security Architecture & Hardening Summary

## Last Updated: January 2026

---

## 1. Role-Based Access Control (RBAC)

### Enforced Roles (app_role enum)
| Role | Scope | Description |
|------|-------|-------------|
| `host` | Global (NULL school_id) | System super-admin, manages all schools |
| `principal` | Single school | School administrator, manages all staff and students |
| `coordinator` | Single school (section) | Section head, manages teachers in their section |
| `class_teacher` | Single class | Manages single class, attendance, students |
| `teacher` | Assigned classes | Subject teacher, manages homework for assigned classes |
| `student` | Own data | Views own attendance, homework, notices |
| `parent` | Linked children | Views data for linked students only |

### Role Locking
- Each user has **exactly one role** - no multi-role accounts
- Role stored in `user_roles` table (never on profile)
- Prevents privilege escalation attacks

---

## 2. Coordinator Permissions (Detailed)

### ✅ Coordinator CAN:
- View all staff (teachers, class teachers) in their assigned section
- Add new teachers/class teachers to their section
- Edit staff member details within their section
- Deactivate/remove teachers from their section
- View section-level reports and statistics
- Update their own profile settings

### ❌ Coordinator CANNOT:
- View or manage staff outside their assigned section
- Create, modify, or delete principals
- Create, modify, or delete other coordinators
- Manage students directly (delegated to class teachers)
- Access other schools' data
- View activity logs (principal-only)
- Modify school settings or branding

### Database Enforcement:
```sql
-- RLS policy on user_roles limits coordinator scope
-- Coordinators can only manage 'teacher' and 'class_teacher' roles
-- within their school_id context
```

---

## 3. Activity Logs Security

### Server-Side Only Insertion
- **RLS Policy**: `"Deny client side log inserts"` uses `WITH CHECK (false)`
- **Edge Functions**: Use service role to bypass RLS for legitimate logging
- **Result**: Immutable audit trail, no client tampering possible

### Visibility Rules:
- **Host**: Can view ALL activity logs (global)
- **Principal**: Can view only their school's logs
- **All Others**: No access to activity logs

---

## 4. Host Role Protection

### Database-Level Trigger: `enforce_host_role_assignment()`
```sql
-- Blocks any attempt to assign 'host' role unless:
-- 1. The caller is already a host (has_role(auth.uid(), 'host'))
-- 2. The operation uses service_role (auth.uid() IS NULL)
```

### Additional Protections:
- `enforce_host_no_school_id()` - Ensures host never has school_id
- Hidden route `/sys-admin-x7k9` - Not linked in any UI
- `ProtectedRoute` guard - Strict role verification

---

## 5. School Isolation (Multi-Tenant)

### RLS Enforcement
- Every table uses `school_id = get_user_school_id(auth.uid())`
- Users can ONLY access data within their school
- No cross-school data leakage possible

### Safe School Deactivation
1. **Soft-delete only** - `is_active = false`, no hard deletion
2. **User check required** - Cannot deactivate if active users exist
3. **Data preserved** - All historical data and logs remain intact

---

## 6. Single Principal Rule

### Database Trigger: `enforce_single_principal()`
- Only ONE active principal per school allowed
- Attempting to assign a second triggers exception
- UI displays clear error message

---

## 7. Production Launch Checklist

### ⚠️ REQUIRED BEFORE PRODUCTION:

- [ ] **Enable Leaked Password Protection**
  - Navigate to: Authentication → Providers → Email
  - Enable: "Detect and prevent sign-up with leaked passwords"
  - [Documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

- [ ] **Disable Auto-Confirm for Production**
  - Enable email verification in production
  - Configure SMTP for email delivery

- [ ] **Review RLS Policies**
  - Run `supabase--linter` to verify all policies
  - Test with different user roles

- [ ] **Configure Rate Limiting**
  - Set appropriate API rate limits
  - Configure auth rate limiting

- [ ] **Enable MFA for Host Account**
  - Critical for super-admin security
  - Configure TOTP or other 2FA method

- [ ] **SSL/TLS Configuration**
  - Ensure all connections use HTTPS
  - Verify Supabase SSL certificate

- [ ] **Backup Configuration**
  - Enable point-in-time recovery
  - Configure backup retention policy

---

## 8. Security Contact

Report security vulnerabilities to the system administrator immediately.
Do not disclose vulnerabilities publicly until patched.
