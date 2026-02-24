/**
 * Central translations dictionary.
 * Keys are dot-separated identifiers. Values are { en, es } pairs.
 * Usage: const { t } = useLanguage(); t('nav.home') → "Home" or "Inicio"
 */

const translations: Record<string, { en: string; es: string }> = {
  // ─── Navigation sections ───
  "nav.main": { en: "Main", es: "Principal" },
  "nav.communications": { en: "Communications", es: "Comunicaciones" },
  "nav.references": { en: "References", es: "Referencias" },
  "nav.navigation": { en: "Navigation", es: "Navegación" },
  "nav.managerTools": { en: "Manager Tools", es: "Herramientas de Gerente" },
  "nav.settings": { en: "Settings", es: "Configuración" },
  "nav.devTools": { en: "Dev Tools", es: "Herramientas de Dev" },

  // ─── Navigation items ───
  "nav.home": { en: "Home", es: "Inicio" },
  "nav.dashboard": { en: "Dashboard", es: "Panel" },
  "nav.shiftReport": { en: "Shift Report", es: "Reporte de Turno" },
  "nav.messages": { en: "Messages", es: "Mensajes" },
  "nav.announcements": { en: "Announcements", es: "Anuncios" },
  "nav.staffAnnouncements": { en: "Staff Announcements", es: "Anuncios del Personal" },
  "nav.responseTemplates": { en: "Response Templates", es: "Plantillas de Respuesta" },
  "nav.resources": { en: "Resources", es: "Recursos" },
  "nav.quickLinks": { en: "Quick Links", es: "Enlaces Rápidos" },
  "nav.resourcePages": { en: "Resource Pages", es: "Páginas de Recursos" },
  "nav.packageTracking": { en: "Package Tracking", es: "Rastreo de Paquetes" },
  "nav.packageTracker": { en: "Package Tracker", es: "Rastreador de Paquetes" },
  "nav.lostAndFound": { en: "Lost & Found", es: "Objetos Perdidos" },
  "nav.whosWorking": { en: "Who's Working", es: "Quién Trabaja" },
  "nav.classSchedule": { en: "Class Schedule", es: "Horario de Clases" },
  "nav.membership": { en: "Membership", es: "Membresía" },
  "nav.analytics": { en: "Analytics", es: "Analíticas" },
  "nav.reports": { en: "Reports", es: "Reportes" },
  "nav.members": { en: "Members", es: "Miembros" },
  "nav.trainingPlans": { en: "Training Plans", es: "Planes de Entrenamiento" },
  "nav.checklists": { en: "Checklists", es: "Listas de Control" },
  "nav.myChecklists": { en: "My Checklists", es: "Mis Listas" },
  "nav.memberCommunications": { en: "Member Communications", es: "Comunicaciones con Miembros" },
  "nav.admin": { en: "Admin", es: "Admin" },
  "nav.staffResources": { en: "Staff Resources", es: "Recursos del Personal" },
  "nav.masterCalendar": { en: "Master Calendar", es: "Calendario Maestro" },
  "nav.notificationCenter": { en: "Notification Center", es: "Centro de Notificaciones" },
  "nav.userManagement": { en: "User Management", es: "Gestión de Usuarios" },
  "nav.shiftNotes": { en: "Shift Notes", es: "Notas de Turno" },
  "nav.eventDrinks": { en: "Event Drinks", es: "Bebidas de Eventos" },
  "nav.bohNotes": { en: "BOH Notes", es: "Notas BOH" },
  "nav.documents": { en: "Documents", es: "Documentos" },
  "nav.packages": { en: "Packages", es: "Paquetes" },

  // Dev Tools sub-items
  "nav.apiSyncing": { en: "API Syncing", es: "Sincronización de API" },
  "nav.apiDataMapping": { en: "API Data Mapping", es: "Mapeo de Datos API" },
  "nav.dataPatterns": { en: "Data Patterns", es: "Patrones de Datos" },
  "nav.backfillManager": { en: "Backfill Manager", es: "Gestor de Backfill" },
  "nav.skippedRecords": { en: "Skipped Records", es: "Registros Omitidos" },
  "nav.bugReports": { en: "Bug Reports", es: "Reportes de Bugs" },
  "nav.testing": { en: "Testing", es: "Pruebas" },
  "nav.devUpdates": { en: "Dev Updates", es: "Actualizaciones Dev" },
  "nav.aiFeedback": { en: "AI Feedback", es: "Comentarios de IA" },
  "nav.notificationExamples": { en: "Notification Examples", es: "Ejemplos de Notificaciones" },

  // ─── User menu ───
  "menu.profile": { en: "Profile", es: "Perfil" },
  "menu.accountSettings": { en: "Account Settings", es: "Configuración de Cuenta" },
  "menu.notifications": { en: "Notifications", es: "Notificaciones" },
  "menu.reportBug": { en: "Report a Bug", es: "Reportar un Error" },
  "menu.signOut": { en: "Sign Out", es: "Cerrar Sesión" },
  "menu.more": { en: "More", es: "Más" },

  // ─── Mobile bottom nav ───
  "mobile.home": { en: "Home", es: "Inicio" },
  "mobile.report": { en: "Report", es: "Reporte" },
  "mobile.comms": { en: "Comms", es: "Comms" },
  "mobile.tools": { en: "Tools", es: "Herramientas" },
  "mobile.checklist": { en: "Checklist", es: "Lista" },
  "mobile.schedule": { en: "Schedule", es: "Horario" },

  // ─── Page titles ───
  "page.concierge": { en: "Concierge", es: "Concierge" },
  "page.cafeDashboard": { en: "Cafe Dashboard", es: "Panel de Café" },
  "page.profile": { en: "Profile", es: "Perfil" },
  "page.accountSettings": { en: "Account Settings", es: "Configuración de Cuenta" },
  "page.qa": { en: "Q&A", es: "Preguntas y Respuestas" },

  // Concierge view titles
  "view.home": { en: "Home", es: "Inicio" },
  "view.shiftReport": { en: "Shift Report", es: "Reporte de Turno" },
  "view.messages": { en: "Messages", es: "Mensajes" },
  "view.announcements": { en: "Announcements", es: "Anuncios" },
  "view.whosWorking": { en: "Who's Working", es: "Quién Trabaja" },
  "view.responseTemplates": { en: "Response Templates", es: "Plantillas de Respuesta" },
  "view.resources": { en: "Resources", es: "Recursos" },
  "view.quickLinks": { en: "Quick Links", es: "Enlaces Rápidos" },
  "view.resourcePages": { en: "Resource Pages", es: "Páginas de Recursos" },
  "view.lostAndFound": { en: "Lost & Found", es: "Objetos Perdidos" },
  "view.packageTracker": { en: "Package Tracker", es: "Rastreador de Paquetes" },
  "view.qa": { en: "Q&A", es: "Preguntas y Respuestas" },

  // ─── Common actions / buttons ───
  "action.save": { en: "Save", es: "Guardar" },
  "action.cancel": { en: "Cancel", es: "Cancelar" },
  "action.continue": { en: "Continue", es: "Continuar" },
  "action.back": { en: "Back", es: "Atrás" },
  "action.submit": { en: "Submit", es: "Enviar" },
  "action.delete": { en: "Delete", es: "Eliminar" },
  "action.edit": { en: "Edit", es: "Editar" },
  "action.close": { en: "Close", es: "Cerrar" },
  "action.search": { en: "Search", es: "Buscar" },
  "action.filter": { en: "Filter", es: "Filtrar" },
  "action.completeSetup": { en: "Complete Setup", es: "Completar Configuración" },
  "action.updatePassword": { en: "Update Password", es: "Actualizar Contraseña" },
  "action.updatingPassword": { en: "Updating Password", es: "Actualizando Contraseña" },
  "action.saving": { en: "Saving", es: "Guardando" },
  "action.settingUp": { en: "Setting up", es: "Configurando" },
  "action.showAppGuide": { en: "Show App Guide", es: "Mostrar Guía de la App" },

  // ─── Account Settings page ───
  "settings.profileInfo": { en: "Profile Information", es: "Información del Perfil" },
  "settings.profileInfoDesc": { en: "Update your display name and personal information.", es: "Actualiza tu nombre y datos personales." },
  "settings.email": { en: "Email", es: "Correo Electrónico" },
  "settings.emailCannotChange": { en: "Email cannot be changed.", es: "El correo no se puede cambiar." },
  "settings.fullName": { en: "Full Name", es: "Nombre Completo" },
  "settings.yourFullName": { en: "Your full name", es: "Tu nombre completo" },
  "settings.changePassword": { en: "Change Password", es: "Cambiar Contraseña" },
  "settings.updateAccountPassword": { en: "Update your account password.", es: "Actualiza la contraseña de tu cuenta." },
  "settings.newPassword": { en: "New Password", es: "Nueva Contraseña" },
  "settings.confirmPassword": { en: "Confirm Password", es: "Confirmar Contraseña" },
  "settings.enterNewPassword": { en: "Enter new password", es: "Ingresa nueva contraseña" },
  "settings.confirmNewPassword": { en: "Confirm new password", es: "Confirmar nueva contraseña" },
  "settings.languagePreference": { en: "Language Preference", es: "Preferencia de Idioma" },
  "settings.languageDesc": { en: "Choose your preferred language for the application.", es: "Elige tu idioma preferido para la aplicación." },
  "settings.notificationPreferences": { en: "Notification Preferences", es: "Preferencias de Notificaciones" },
  "settings.notificationDesc": { en: "Control which notifications you receive and how.", es: "Controla qué notificaciones recibes y cómo." },
  "settings.bugReportBadges": { en: "Bug Report Badges", es: "Insignias de Reportes de Bugs" },
  "settings.bugReportBadgesDesc": { en: "Show unread bug report count in the Dev Tools navigation.", es: "Mostrar el conteo de reportes de bugs no leídos en la navegación de Dev Tools." },
  "settings.appGuide": { en: "App Guide", es: "Guía de la App" },
  "settings.appGuideDesc": { en: "Replay the in-app walkthrough to see key features again.", es: "Reproduce la guía de la app para ver de nuevo las funciones principales." },

  // ─── Profile page ───
  "profile.email": { en: "Email", es: "Correo Electrónico" },
  "profile.roles": { en: "Roles", es: "Roles" },
  "profile.preferredLanguage": { en: "Preferred Language", es: "Idioma Preferido" },
  "profile.accountCreated": { en: "Account Created", es: "Cuenta Creada" },
  "profile.noRolesAssigned": { en: "No roles assigned", es: "Sin roles asignados" },
  "profile.languageEnglish": { en: "English", es: "Inglés" },
  "profile.languageSpanish": { en: "Spanish", es: "Español" },

  // ─── Onboarding ───
  "onboarding.completeProfile": { en: "Complete Your Profile", es: "Completa Tu Perfil" },
  "onboarding.createPassword": { en: "Create a new password to continue", es: "Crea una nueva contraseña para continuar" },
  "onboarding.tellUs": { en: "Tell us about yourself", es: "Cuéntanos sobre ti" },
  "onboarding.chooseLanguage": { en: "Choose your language", es: "Elige tu idioma" },
  "onboarding.fullName": { en: "Full Name", es: "Nombre Completo" },
  "onboarding.enterFullName": { en: "Enter your full name", es: "Ingresa tu nombre completo" },
  "onboarding.nameDisplayed": { en: "This name will be displayed across the platform", es: "Este nombre se mostrará en toda la plataforma" },
  "onboarding.changeLanguageLater": { en: "You can change this later in the app", es: "Puedes cambiar esto después en la app" },
  "onboarding.passwordSetByAdmin": { en: "Your password was set by an administrator. Please create your own password to continue.", es: "Tu contraseña fue establecida por un administrador. Por favor, crea tu propia contraseña para continuar." },

  // ─── Toasts / messages ───
  "toast.nameUpdated": { en: "Name updated successfully", es: "Nombre actualizado correctamente" },
  "toast.nameUpdateFailed": { en: "Failed to update name", es: "Error al actualizar el nombre" },
  "toast.passwordUpdated": { en: "Password updated successfully", es: "Contraseña actualizada correctamente" },
  "toast.passwordUpdateFailed": { en: "An unexpected error occurred", es: "Ocurrió un error inesperado" },
  "toast.setupComplete": { en: "Setup complete", es: "Configuración completada" },
  "toast.setupCompletePending": { en: "Setup complete - pending manager approval", es: "Configuración completada - pendiente aprobación del gerente" },
  "toast.profileSaveFailed": { en: "Failed to save profile", es: "Error al guardar el perfil" },
  "toast.languageSaveFailed": { en: "Failed to save language preference", es: "Error al guardar la preferencia de idioma" },
  "toast.enterName": { en: "Please enter your name", es: "Por favor ingresa tu nombre" },
  "toast.noSession": { en: "User session not found", es: "Sesión de usuario no encontrada" },
  "toast.signedOut": { en: "Signed out", es: "Sesión cerrada" },
  "toast.signOutFailed": { en: "Failed to sign out", es: "Error al cerrar sesión" },

  // ─── Validation ───
  "validation.passwordMin6": { en: "Password must be at least 6 characters", es: "La contraseña debe tener al menos 6 caracteres" },
  "validation.passwordsMismatch": { en: "Passwords don't match", es: "Las contraseñas no coinciden" },

  // ─── Shift report tabs ───
  "report.currentShift": { en: "Current shift", es: "Turno actual" },
  "report.pastReports": { en: "Past reports", es: "Reportes anteriores" },

  // ─── Greeting ───
  "greeting.hi": { en: "Hi", es: "Hola" },
};

export default translations;
