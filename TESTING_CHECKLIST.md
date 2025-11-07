# ✅ Quick Testing Checklist

## 🚀 Before You Start
```bash
cd PeoplePickerc21
npm run dev
```

Open: http://localhost:3000

---

## 1️⃣ Basic Click Test
- [ ] See avatar in top-right corner
- [ ] Click avatar
- [ ] Menu opens (280px wide, not tiny!)
- [ ] Click avatar again → menu closes

---

## 2️⃣ Menu Stability Test
- [ ] Open menu
- [ ] Move mouse over menu items (should NOT disappear!)
- [ ] Hover over each item → see hover effect
- [ ] Click outside menu → closes

---

## 3️⃣ Admin Test (if you're admin)
- [ ] Open menu
- [ ] See "🛡️ Admin Dashboard" option
- [ ] Click it → goes to /admin/dashboard
- [ ] Check main page footer → NO separate Admin link

---

## 4️⃣ Theme Toggle Test
- [ ] Open menu
- [ ] See "🌙 Dark Mode" (if in light mode)
- [ ] Click it → page turns dark
- [ ] Menu shows "☀️ Light Mode"
- [ ] Click again → back to light
- [ ] Refresh page → theme persists

---

## 5️⃣ Navigation Test
- [ ] Click "👤 My Profile" → goes to your profile page
- [ ] Go back, open menu again
- [ ] Click "🚪 Sign Out" → logs you out

---

## 6️⃣ Keyboard Test
- [ ] Open menu
- [ ] Press Escape → menu closes

---

## 7️⃣ Mobile Test (optional)
- [ ] Resize browser to mobile width
- [ ] Tap avatar
- [ ] Menu appears
- [ ] Tap outside → closes

---

## ✅ Success Criteria

All of these should be TRUE:
- ✅ Menu doesn't disappear when moving mouse
- ✅ Menu is big enough to read comfortably
- ✅ Admin link is inside menu (not separate)
- ✅ Theme toggle works and persists
- ✅ All links work correctly
- ✅ Clicking outside closes menu
- ✅ Escape key closes menu

---

## 🐛 If Something's Wrong

**Menu disappears immediately?**
- Check browser console for errors
- Make sure UserMenu.tsx was created correctly

**Theme doesn't persist?**
- Check localStorage in browser dev tools
- Should see `theme: "dark"` or `theme: "light"`

**Admin link shows for non-admins?**
- Check `/api/admin/check` endpoint
- Verify `isAdmin` prop is passed correctly

**Menu looks weird?**
- Run `npm run build` to rebuild Tailwind
- Check that `darkMode: 'class'` is in tailwind.config.js

---

## 📞 Next Steps After Testing

**If everything works:**
```bash
git add -A
git commit -m "feat: upgrade user menu with theme toggle"
git push origin main
```

**If something doesn't work:**
- Take a screenshot
- Note what you tried to do
- Check browser console for errors
- Let me know and I'll fix it!

---

**Estimated testing time:** 5 minutes 🚀
