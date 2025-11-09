# Office 365 Tenancy & SMTP Domain Management - Feature Guide

## 📍 Where to Find It

Navigate to: **Admin Panel → Configuration**

URL: `/admin/configuration`

## 🎨 UI Layout

The Configuration page now contains three sections:

```
┌─────────────────────────────────────────────────────────────┐
│  ⚙️  Configuration                                           │
│  Manage application settings and integrations               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🖥️  Okta Environment                           [ACTIVE]    │
├─────────────────────────────────────────────────────────────┤
│  Organization URL: [https://dev-12345.okta.com]            │
│  API Token: [••••••••••••••••] [👁️]                        │
│  [Test Connection] [Cancel] [Save to Database]             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ☁️  Office 365 Tenancies                  [+ Add Tenant]   │
├─────────────────────────────────────────────────────────────┤
│  Name     │ Tenant ID │ Status  │ Feature Flags │ Domains │ │
│  UK Office│ abc-123...│ Enabled │ ✓✓✓✓✗        │    3    │ │
│  US Office│ def-456...│ Enabled │ ✓✓✓✗✗        │    1    │ │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  📧 SMTP Domain Routing                    [+ Add Domain]   │
├─────────────────────────────────────────────────────────────┤
│  Domain          │ Assigned Tenant │ Status  │ Priority │   │
│  plan.org.uk     │ UK Office       │ Enabled │    0     │   │
│  plan-usa.org    │ US Office       │ Enabled │    0     │   │
└─────────────────────────────────────────────────────────────┘
```

## 🏢 Office 365 Tenancies Section

### Main View
- **Blue header** with cloud icon
- **"+ Add Tenant"** button (top right)
- **Table Columns:**
  1. **Name** - Friendly name (e.g., "UK Office")
  2. **Tenant ID** - Azure AD tenant UUID
  3. **Status** - Enabled/Disabled badge
  4. **Feature Flags** - 5 colored badges:
     - ✅ Green = Enabled
     - ⭕ Gray = Disabled
     - Labels: Presence, Photos, OOO, Local Groups, Global Groups
  5. **Domains** - Count of associated domains
  6. **Actions** - Edit ✏️ and Delete 🗑️ buttons

### Add/Edit Modal

```
┌─────────────────────────────────────────────┐
│  Add Office 365 Tenant                   [X]│
├─────────────────────────────────────────────┤
│  Friendly Name *                            │
│  [UK Office                            ]    │
│                                             │
│  Entra Tenant ID *                          │
│  [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx ]    │
│                                             │
│  Entra Client ID *                          │
│  [xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx ]    │
│                                             │
│  Entra Client Secret *           [👁️]      │
│  [••••••••••••••••••••••••••••••••]         │
│                                             │
│  ⚪ Enable this tenant                      │
│                                             │
│  ━━━ Feature Flags ━━━                     │
│  ✅ Enable Presence Lookup                  │
│     Presence.Read.All permission            │
│                                             │
│  ✅ Enable Profile Photos                   │
│     User.Read.All permission                │
│                                             │
│  ✅ Enable Out of Office Status             │
│     MailboxSettings.Read permission         │
│                                             │
│  ⚪ Enable Local Groups                     │
│     Query local tenant groups               │
│                                             │
│  ⚪ Enable Global Groups (ℹ️)                │
│     Shows Groups tab in UI                  │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel] [Create]        │
└─────────────────────────────────────────────┘
```

### Features
- **Validation:**
  - All required fields validated
  - UUID format checked for tenant/client IDs
  - Client secret required on create, optional on update
- **Behavior:**
  - Tenant/Client IDs disabled when editing (cannot change)
  - Client secret masked on edit, only updates if changed
  - Feature flags default to enabled (except groups)
- **Tooltips:**
  - Info icon on "Feature Flags" header
  - Info icon on "Global Groups" toggle

## 📧 SMTP Domain Routing Section

### Main View
- **Purple header** with mail icon
- **"+ Add Domain"** button (top right)
- **Table Columns:**
  1. **Domain** - Email domain (e.g., "plan.org.uk")
  2. **Assigned Tenant** - Friendly name + Tenant ID
  3. **Tenant Status** - Shows if tenant enabled/disabled
  4. **Priority** - Numeric priority for routing
  5. **Actions** - Edit ✏️ and Delete 🗑️ buttons

### Add/Edit Modal

```
┌─────────────────────────────────────────────┐
│  Add SMTP Domain                         [X]│
├─────────────────────────────────────────────┤
│  Email Domain *                             │
│  [plan.org.uk                          ]    │
│  Enter domain without @ symbol              │
│                                             │
│  Assigned Tenant *                          │
│  [▼ UK Office                          ]    │
│     - UK Office                             │
│     - US Office                             │
│                                             │
│  Priority                                   │
│  [0                                    ]    │
│  Higher priority domains checked first      │
│                                             │
├─────────────────────────────────────────────┤
│                    [Cancel] [Create]        │
└─────────────────────────────────────────────┘
```

### Features
- **Validation:**
  - Domain format checked (must have dot, no @ symbol)
  - Tenant must exist (dropdown validation)
- **Behavior:**
  - Dropdown shows tenant friendly names
  - Shows "(Disabled)" next to disabled tenants
  - Priority defaults to 0
- **Edge Cases:**
  - Warning shown if no tenants exist yet
  - "Add Tenant First" message with disabled create button

## 🔔 Notifications

### Success Toast
```
┌─────────────────────────────────────────────┐
│  ✅ Success                                  │
│  Tenancy created successfully               │
└─────────────────────────────────────────────┘
```
- Green background with green border
- Auto-dismisses after 3 seconds
- Shows at top of section

### Error Toast
```
┌─────────────────────────────────────────────┐
│  ❌ Error                                 [X]│
│  Tenancy with this Tenant ID already exists │
└─────────────────────────────────────────────┘
```
- Red background with red border
- Manual dismiss via X button
- Shows specific error message from API

## ⚠️ Confirmation Dialogs

### Delete Tenancy (with domains)
```
⚠️ Are you sure you want to delete "UK Office"?
   This will also delete 3 associated domain(s).

   [Cancel]  [OK]
```

### Delete Tenancy (no domains)
```
⚠️ Are you sure you want to delete "US Office"?

   [Cancel]  [OK]
```

### Delete Domain
```
⚠️ Are you sure you want to delete the domain "plan.org.uk"?

   [Cancel]  [OK]
```

## 🎯 Empty States

### No Tenancies
```
┌─────────────────────────────────────────────┐
│              ☁️                              │
│                                             │
│    No tenants configured yet                │
│    Add your first Office 365 tenant to     │
│    enable multi-tenancy support             │
│                                             │
│         [+ Add First Tenant]                │
└─────────────────────────────────────────────┘
```

### No Domains
```
┌─────────────────────────────────────────────┐
│              📧                              │
│                                             │
│    No domains configured yet                │
│    Map email domains to Office 365 tenants │
│    for intelligent routing                  │
│                                             │
│         [+ Add First Domain]                │
└─────────────────────────────────────────────┘
```

## 🔄 Loading States

### Table Loading
```
┌─────────────────────────────────────────────┐
│              ⏳ (spinning)                   │
└─────────────────────────────────────────────┘
```

### Modal Loading (on tenancy fetch)
```
┌─────────────────────────────────────────────┐
│  Add SMTP Domain                         [X]│
├─────────────────────────────────────────────┤
│              ⏳ (spinning)                   │
└─────────────────────────────────────────────┘
```

### Button Loading States
- **Saving:** `⏳ Saving...` (spinner + text)
- **Deleting:** Button shows spinner in place of icon
- **Testing:** `⏳ Testing...` (Okta connection)

## 🎨 Color Scheme

### Status Badges
- **Enabled:** Green (`bg-green-100 text-green-800`)
- **Disabled:** Gray (`bg-gray-100 text-gray-800`)

### Feature Flags
- **Enabled:** Green badge with checkmark
- **Disabled:** Gray badge with X

### Section Headers
- **Okta:** Green (`bg-green-50 border-green-200`)
- **Tenancies:** Blue (`bg-blue-50 border-blue-200`)
- **Domains:** Purple (`bg-purple-50 border-purple-200`)

### Buttons
- **Primary Actions:** Blue (`bg-blue-600 hover:bg-blue-700`)
- **Add Tenant:** Blue (`bg-blue-600`)
- **Add Domain:** Purple (`bg-purple-600`)
- **Edit:** Blue text (`text-blue-600 hover:text-blue-900`)
- **Delete:** Red text (`text-red-600 hover:text-red-900`)
- **Cancel:** Gray border (`border-gray-300`)

## 📱 Responsive Design

- **Desktop:** Full table with all columns
- **Tablet:** Table scrolls horizontally if needed
- **Mobile:** Uses `overflow-x-auto` on table container
- **Modals:** Max width 2xl for tenancy, md for domain
- **Max Height:** Modals limited to 90vh with scroll

## ⌨️ Keyboard Navigation

- **Tab:** Navigate between form fields
- **Enter:** Submit form (when focused on button)
- **Escape:** Close modal (click overlay)
- **Space:** Toggle switches
- **Arrow Keys:** Navigate dropdown options

## 🔍 Field Validation

### Real-time Validation
- **Tenant ID:** UUID format, required
- **Client ID:** UUID format, required
- **Client Secret:** Required on create only
- **Domain:** Valid domain format, no @ symbol

### Server-side Validation
- **Unique Constraints:** Tenant ID, Domain
- **Foreign Keys:** Tenancy must exist for domain
- **Format Checks:** Regex validation on server

### Error Display
- **Inline:** Red border on input + error message below
- **Submit Errors:** Red alert box at top of modal
- **Toast Notifications:** Top of section after save/delete

## 🔐 Security Indicators

### Client Secret
- **Create Mode:** Regular password input
- **Edit Mode:** Shows `••••••••••••••••`
- **Show/Hide:** Eye icon toggles visibility
- **Update Behavior:** Only saves if changed (not masked)

### Encryption Notice
```
ℹ️ Secret will be encrypted before storage
```
- Shown below client secret field on create
- Gray text, small font

### Admin Badge (in header)
```
┌──────────────────────────────────┐
│  ⚠️ Emergency Access              │
└──────────────────────────────────┘
```
- Red background if emergency session
- Shown in top navigation

## 📊 Data Display

### Tenant ID Format
```
abc12345-1234-5678-9012-def67890abcd
```
- Monospace font (`font-mono`)
- Full UUID displayed
- Small gray text in domain table

### Feature Flags Display
```
✅ Presence  ✅ Photos  ✅ OOO  ⭕ Local Groups  ⭕ Global Groups
```
- Badges wrap on narrow screens
- Consistent spacing (`gap-1`)
- Clear visual distinction enabled vs disabled

### Domain Count
```
3
```
- Plain number
- Links to count of associated domains
- Used in warning message on delete

## 🎭 Animations

### Modal Entry/Exit
- Fade in background overlay
- No explicit animation framework (browser default)

### Loading Spinners
- `animate-spin` class
- Smooth rotation
- Blue/purple color matching section

### Button Hover
- `transition-colors` on all buttons
- Smooth color change
- Hover states clearly defined

## 📝 User Flows

### Creating First Tenant
1. Land on Configuration page
2. See "No tenants configured yet" empty state
3. Click "Add First Tenant" or "+ Add Tenant"
4. Fill required fields (name, tenant ID, client ID, secret)
5. Configure feature flags (optional)
6. Click "Create"
7. See success toast
8. Table shows new tenant with badges

### Adding Domain
1. Ensure at least one tenant exists
2. Click "+ Add Domain"
3. Enter domain (e.g., "plan.org.uk")
4. Select tenant from dropdown
5. Set priority (optional)
6. Click "Create"
7. See success toast
8. Table shows new domain with tenant info

### Editing Tenancy
1. Click edit icon on tenancy row
2. Modal opens with current values
3. Tenant/Client IDs are disabled (grayed out)
4. Client secret shows masked value
5. Toggle feature flags as needed
6. Click "Update"
7. See success toast
8. Table updates with new badges

### Deleting Tenancy
1. Click delete icon on tenancy row
2. Confirmation dialog shows
3. If domains exist, shows count warning
4. Click "OK" to confirm
5. Row disappears
6. Success toast appears
7. Associated domains also deleted

## 🧪 Test Scenarios

### Happy Path
1. ✅ Create tenant with all flags enabled
2. ✅ Create 2-3 domains assigned to tenant
3. ✅ Edit tenant to disable some flags
4. ✅ Reassign domain to different tenant
5. ✅ Delete domain
6. ✅ Delete tenant (with remaining domains)

### Edge Cases
1. ✅ Try to add domain when no tenants exist
2. ✅ Try to create tenant with duplicate tenant ID
3. ✅ Try to create domain with duplicate name
4. ✅ Try to save tenant with invalid UUID
5. ✅ Try to save domain with @ symbol
6. ✅ Delete tenant that has multiple domains

### Error Handling
1. ✅ Network failure during save
2. ✅ Server returns 500 error
3. ✅ Validation error from API
4. ✅ Foreign key constraint violation
5. ✅ Unique constraint violation

---

**Feature Status:** ✅ Fully Functional  
**UI Status:** ✅ Matches Design System  
**Testing Status:** ✅ Ready for QA  
**Documentation:** ✅ Complete
