import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'it' | 'es' | 'de' | 'en' | 'en-US';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traduzioni
const translations = {
  it: {
    // Welcome Screen
    'welcome.tagline': 'Piattaforma Social Musicale',
    'welcome.discover.title': 'Scopri Musica',
    'welcome.discover.description': 'Scorri contenuti musicali infiniti da creatori di talento',
    'welcome.create.title': 'Crea e Condividi',
    'welcome.create.description': 'Carica la tua musica e raggiungi milioni di ascoltatori nel mondo',
    'welcome.connect.title': 'Connettiti',
    'welcome.connect.description': 'Interagisci con artisti, metti like, commenta e costruisci la tua community musicale',
    'welcome.signin': 'Accedi',
    'welcome.signup': 'Crea Account',
    'welcome.guest': 'Continua come Ospite',
    'welcome.footer': 'Unisciti a migliaia di amanti della musica e creatori',
    'welcome.language': 'Lingua',

    // Auth Screen
    'auth.welcome.back': 'Bentornato',
    'auth.join': 'Unisciti a Drezzle',
    'auth.signin.subtitle': 'Accedi per continuare il tuo viaggio musicale',
    'auth.signup.subtitle': 'Crea il tuo account e inizia a condividere musica',
    'auth.email': 'Email',
    'auth.username': 'Nome utente',
    'auth.password': 'Password',
    'auth.role.choose': 'Scegli il tuo ruolo:',
    'auth.role.listener.description': 'Ascolta, metti like, commenta e salva contenuti',
    'auth.role.creator.description': 'Pubblica contenuti, interagisce e costruisce il tuo pubblico',
    'auth.role.expert.description': 'Come Listener + verifica con documenti di studi musicali',
    'auth.role.label.description': 'Etichetta discografica verificata dall\'admin',
    'auth.role.expert.note': '* Richiede verifica documenti',
    'auth.role.label.note': '* Richiede approvazione admin',
    'auth.signin.button': 'Accedi',
    'auth.signup.button': 'Crea Account',
    'auth.switch.signup': 'Non hai un account? Registrati',
    'auth.switch.signin': 'Hai già un account? Accedi',
    'auth.loading': 'Caricamento...',

    // Feed Screen
    'feed.empty': 'Nessun contenuto disponibile',
    'feed.loading': 'Caricamento Feed...',

    // Upload Screen
    'upload.title': 'Carica Contenuto',
    'upload.content.type': 'Tipo di Contenuto',
    'upload.audio': 'Audio',
    'upload.video': 'Video',
    'upload.title.label': 'Titolo *',
    'upload.title.placeholder': 'Dai al tuo {type} un titolo accattivante...',
    'upload.description.label': 'Descrizione',
    'upload.description.placeholder': 'Parlaci del tuo {type}...',
    'upload.audio.file': 'File Audio *',
    'upload.video.file': 'File Video *',
    'upload.audio.selected': 'File audio selezionato',
    'upload.video.selected': 'File video selezionato',
    'upload.select.audio': 'Seleziona file audio',
    'upload.select.video': 'Seleziona file video',
    'upload.audio.formats': 'MP3, WAV, AAC supportati',
    'upload.video.formats': 'MP4, MOV supportati (max 60s)',
    'upload.cover.image': 'Immagine di Copertina',
    'upload.cover.selected': 'Immagine di copertina selezionata',
    'upload.cover.add': 'Aggiungi immagine di copertina',
    'upload.cover.note': 'Le immagini quadrate funzionano meglio',
    'upload.cover.video.note': 'Opzionale - verrà usata la miniatura del video se non fornita',
    'upload.guidelines': 'Linee Guida Caricamento',
    'upload.guideline.size.audio': 'File audio fino a 10MB',
    'upload.guideline.size.video': 'File video fino a 50MB (max 60s)',
    'upload.guideline.original': 'Carica solo contenuto originale',
    'upload.guideline.respectful': 'Solo contenuto rispettoso',
    'upload.guideline.integrated': 'Video con audio integrato preferito',
    'upload.post': 'Pubblica',
    'upload.uploading': 'Caricamento...',

    // Profile Screen
    'profile.title': 'Profilo',
    'profile.quick.actions': 'Azioni Rapide',
    'profile.settings': 'Impostazioni',
    'profile.expert.badge': 'Richiedi Badge Expert',
    'profile.label.status': 'Richiedi Status Etichetta',
    'profile.upload.content': 'Carica Contenuto',
    'profile.notifications': 'Notifiche Push',
    'profile.privacy': 'Privacy e Sicurezza',
    'profile.help': 'Aiuto e Supporto',
    'profile.about': 'Informazioni',
    'profile.logout': 'Esci',

    // Comments Screen
    'comments.title': 'Commenti',
    'comments.empty': 'Nessun commento ancora',
    'comments.empty.subtitle': 'Sii il primo a commentare!',
    'comments.add.placeholder': 'Aggiungi un commento...',

    // Common
    'common.loading': 'Caricamento...',
    'common.error': 'Errore',
    'common.success': 'Successo',
    'common.cancel': 'Annulla',
    'common.ok': 'OK',
    'common.back': 'Indietro',
    'common.next': 'Avanti',
    'common.save': 'Salva',
    'common.delete': 'Elimina',
    'common.edit': 'Modifica',
    'common.share': 'Condividi',
    'common.like': 'Mi piace',
    'common.comment': 'Commenta',
    'common.comments': 'commenti',
    'common.likes': 'mi piace',

    // Roles
    'role.listener': 'Listener',
    'role.creator': 'Creator', 
    'role.expert': 'Expert',
    'role.label': 'Label',

    // Languages
    'language.italian': 'Italiano',
    'language.spanish': 'Spagnolo',
    'language.german': 'Tedesco',
    'language.english': 'Inglese',
    'language.american': 'Inglese (US)',
  },

  es: {
    // Welcome Screen
    'welcome.tagline': 'Plataforma Social Musical',
    'welcome.discover.title': 'Descubre Música',
    'welcome.discover.description': 'Desliza por contenido musical infinito de creadores talentosos',
    'welcome.create.title': 'Crea y Comparte',
    'welcome.create.description': 'Sube tu música y llega a millones de oyentes en todo el mundo',
    'welcome.connect.title': 'Conecta',
    'welcome.connect.description': 'Interactúa con artistas, da me gusta, comenta y construye tu comunidad musical',
    'welcome.signin': 'Iniciar Sesión',
    'welcome.signup': 'Crear Cuenta',
    'welcome.guest': 'Continuar como Invitado',
    'welcome.footer': 'Únete a miles de amantes de la música y creadores',
    'welcome.language': 'Idioma',

    // Auth Screen
    'auth.welcome.back': 'Bienvenido de Vuelta',
    'auth.join': 'Únete a Drezzle',
    'auth.signin.subtitle': 'Inicia sesión para continuar tu viaje musical',
    'auth.signup.subtitle': 'Crea tu cuenta y comienza a compartir música',
    'auth.email': 'Correo',
    'auth.username': 'Nombre de usuario',
    'auth.password': 'Contraseña',
    'auth.role.choose': 'Elige tu rol:',
    'auth.role.listener.description': 'Escucha, da me gusta, comenta y guarda contenido',
    'auth.role.creator.description': 'Publica contenido, interactúa y construye tu audiencia',
    'auth.role.expert.description': 'Como Listener + verificación con documentos de estudios musicales',
    'auth.role.label.description': 'Discográfica verificada por el admin',
    'auth.role.expert.note': '* Requiere verificación de documentos',
    'auth.role.label.note': '* Requiere aprobación del admin',
    'auth.signin.button': 'Iniciar Sesión',
    'auth.signup.button': 'Crear Cuenta',
    'auth.switch.signup': '¿No tienes cuenta? Regístrate',
    'auth.switch.signin': '¿Ya tienes cuenta? Inicia sesión',
    'auth.loading': 'Cargando...',

    // Feed Screen
    'feed.empty': 'No hay contenido disponible',
    'feed.loading': 'Cargando Feed...',

    // Upload Screen
    'upload.title': 'Subir Contenido',
    'upload.content.type': 'Tipo de Contenido',
    'upload.audio': 'Audio',
    'upload.video': 'Video',
    'upload.title.label': 'Título *',
    'upload.title.placeholder': 'Dale a tu {type} un título atractivo...',
    'upload.description.label': 'Descripción',
    'upload.description.placeholder': 'Cuéntanos sobre tu {type}...',
    'upload.audio.file': 'Archivo de Audio *',
    'upload.video.file': 'Archivo de Video *',
    'upload.audio.selected': 'Archivo de audio seleccionado',
    'upload.video.selected': 'Archivo de video seleccionado',
    'upload.select.audio': 'Seleccionar archivo de audio',
    'upload.select.video': 'Seleccionar archivo de video',
    'upload.audio.formats': 'MP3, WAV, AAC soportados',
    'upload.video.formats': 'MP4, MOV soportados (máx 60s)',
    'upload.cover.image': 'Imagen de Portada',
    'upload.cover.selected': 'Imagen de portada seleccionada',
    'upload.cover.add': 'Agregar imagen de portada',
    'upload.cover.note': 'Las imágenes cuadradas funcionan mejor',
    'upload.cover.video.note': 'Opcional - se usará la miniatura del video si no se proporciona',
    'upload.guidelines': 'Pautas de Subida',
    'upload.guideline.size.audio': 'Archivos de audio hasta 10MB',
    'upload.guideline.size.video': 'Archivos de video hasta 50MB (máx 60s)',
    'upload.guideline.original': 'Solo sube contenido original',
    'upload.guideline.respectful': 'Solo contenido respetuoso',
    'upload.guideline.integrated': 'Video con audio integrado preferido',
    'upload.post': 'Publicar',
    'upload.uploading': 'Subiendo...',

    // Profile Screen
    'profile.title': 'Perfil',
    'profile.quick.actions': 'Acciones Rápidas',
    'profile.settings': 'Configuración',
    'profile.expert.badge': 'Solicitar Insignia de Experto',
    'profile.label.status': 'Solicitar Estado de Discográfica',
    'profile.upload.content': 'Subir Contenido',
    'profile.notifications': 'Notificaciones Push',
    'profile.privacy': 'Privacidad y Seguridad',
    'profile.help': 'Ayuda y Soporte',
    'profile.about': 'Acerca de',
    'profile.logout': 'Cerrar Sesión',

    // Comments Screen
    'comments.title': 'Comentarios',
    'comments.empty': 'No hay comentarios aún',
    'comments.empty.subtitle': '¡Sé el primero en comentar!',
    'comments.add.placeholder': 'Agregar un comentario...',

    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.ok': 'OK',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.share': 'Compartir',
    'common.like': 'Me gusta',
    'common.comment': 'Comentar',
    'common.comments': 'comentarios',
    'common.likes': 'me gusta',

    // Roles
    'role.listener': 'Oyente',
    'role.creator': 'Creador',
    'role.expert': 'Experto',
    'role.label': 'Discográfica',

    // Languages
    'language.italian': 'Italiano',
    'language.spanish': 'Español',
    'language.german': 'Alemán',
    'language.english': 'Inglés',
    'language.american': 'Inglés (US)',
  },

  de: {
    // Welcome Screen
    'welcome.tagline': 'Soziale Musikplattform',
    'welcome.discover.title': 'Musik Entdecken',
    'welcome.discover.description': 'Durchstöbere endlose Musikinhalte von talentierten Kreativen',
    'welcome.create.title': 'Erstellen & Teilen',
    'welcome.create.description': 'Lade deine Musik hoch und erreiche Millionen von Zuhörern weltweit',
    'welcome.connect.title': 'Verbinden',
    'welcome.connect.description': 'Interagiere mit Künstlern, like, kommentiere und baue deine Musik-Community auf',
    'welcome.signin': 'Anmelden',
    'welcome.signup': 'Konto Erstellen',
    'welcome.guest': 'Als Gast Fortfahren',
    'welcome.footer': 'Schließe dich Tausenden von Musikliebhabern und Kreativen an',
    'welcome.language': 'Sprache',

    // Auth Screen
    'auth.welcome.back': 'Willkommen Zurück',
    'auth.join': 'Tritt Drezzle Bei',
    'auth.signin.subtitle': 'Melde dich an, um deine musikalische Reise fortzusetzen',
    'auth.signup.subtitle': 'Erstelle dein Konto und beginne Musik zu teilen',
    'auth.email': 'E-Mail',
    'auth.username': 'Benutzername',
    'auth.password': 'Passwort',
    'auth.role.choose': 'Wähle deine Rolle:',
    'auth.role.listener.description': 'Höre zu, like, kommentiere und speichere Inhalte',
    'auth.role.creator.description': 'Veröffentliche Inhalte, interagiere und baue dein Publikum auf',
    'auth.role.expert.description': 'Wie Listener + Verifizierung mit Musikstudien-Dokumenten',
    'auth.role.label.description': 'Vom Admin verifiziertes Plattenlabel',
    'auth.role.expert.note': '* Erfordert Dokumentenverifizierung',
    'auth.role.label.note': '* Erfordert Admin-Genehmigung',
    'auth.signin.button': 'Anmelden',
    'auth.signup.button': 'Konto Erstellen',
    'auth.switch.signup': 'Hast du kein Konto? Registriere dich',
    'auth.switch.signin': 'Hast du bereits ein Konto? Melde dich an',
    'auth.loading': 'Lädt...',

    // Feed Screen
    'feed.empty': 'Kein Inhalt verfügbar',
    'feed.loading': 'Feed Lädt...',

    // Upload Screen
    'upload.title': 'Inhalt Hochladen',
    'upload.content.type': 'Inhaltstyp',
    'upload.audio': 'Audio',
    'upload.video': 'Video',
    'upload.title.label': 'Titel *',
    'upload.title.placeholder': 'Gib deinem {type} einen eingängigen Titel...',
    'upload.description.label': 'Beschreibung',
    'upload.description.placeholder': 'Erzähle uns von deinem {type}...',
    'upload.audio.file': 'Audio-Datei *',
    'upload.video.file': 'Video-Datei *',
    'upload.audio.selected': 'Audio-Datei ausgewählt',
    'upload.video.selected': 'Video-Datei ausgewählt',
    'upload.select.audio': 'Audio-Datei auswählen',
    'upload.select.video': 'Video-Datei auswählen',
    'upload.audio.formats': 'MP3, WAV, AAC unterstützt',
    'upload.video.formats': 'MP4, MOV unterstützt (max 60s)',
    'upload.cover.image': 'Cover-Bild',
    'upload.cover.selected': 'Cover-Bild ausgewählt',
    'upload.cover.add': 'Cover-Bild hinzufügen',
    'upload.cover.note': 'Quadratische Bilder funktionieren am besten',
    'upload.cover.video.note': 'Optional - Video-Thumbnail wird verwendet, wenn nicht bereitgestellt',
    'upload.guidelines': 'Upload-Richtlinien',
    'upload.guideline.size.audio': 'Audio-Dateien bis zu 10MB',
    'upload.guideline.size.video': 'Video-Dateien bis zu 50MB (max 60s)',
    'upload.guideline.original': 'Nur originalen Inhalt hochladen',
    'upload.guideline.respectful': 'Nur respektvolle Inhalte',
    'upload.guideline.integrated': 'Video mit integriertem Audio bevorzugt',
    'upload.post': 'Veröffentlichen',
    'upload.uploading': 'Hochladen...',

    // Profile Screen
    'profile.title': 'Profil',
    'profile.quick.actions': 'Schnelle Aktionen',
    'profile.settings': 'Einstellungen',
    'profile.expert.badge': 'Experten-Badge Anfordern',
    'profile.label.status': 'Label-Status Anfordern',
    'profile.upload.content': 'Inhalt Hochladen',
    'profile.notifications': 'Push-Benachrichtigungen',
    'profile.privacy': 'Datenschutz & Sicherheit',
    'profile.help': 'Hilfe & Support',
    'profile.about': 'Über',
    'profile.logout': 'Abmelden',

    // Comments Screen
    'comments.title': 'Kommentare',
    'comments.empty': 'Noch keine Kommentare',
    'comments.empty.subtitle': 'Sei der erste, der kommentiert!',
    'comments.add.placeholder': 'Einen Kommentar hinzufügen...',

    // Common
    'common.loading': 'Lädt...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.cancel': 'Abbrechen',
    'common.ok': 'OK',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.share': 'Teilen',
    'common.like': 'Gefällt mir',
    'common.comment': 'Kommentieren',
    'common.comments': 'Kommentare',
    'common.likes': 'Gefällt mir',

    // Roles
    'role.listener': 'Zuhörer',
    'role.creator': 'Ersteller',
    'role.expert': 'Experte',
    'role.label': 'Label',

    // Languages
    'language.italian': 'Italienisch',
    'language.spanish': 'Spanisch',
    'language.german': 'Deutsch',
    'language.english': 'Englisch',
    'language.american': 'Englisch (US)',
  },

  en: {
    // Welcome Screen
    'welcome.tagline': 'Social Music Platform',
    'welcome.discover.title': 'Discover Music',
    'welcome.discover.description': 'Swipe through endless musical content from talented creators',
    'welcome.create.title': 'Create & Share',
    'welcome.create.description': 'Upload your music and reach millions of listeners worldwide',
    'welcome.connect.title': 'Connect',
    'welcome.connect.description': 'Engage with artists, like, comment, and build your music community',
    'welcome.signin': 'Sign In',
    'welcome.signup': 'Create Account',
    'welcome.guest': 'Continue as Guest',
    'welcome.footer': 'Join thousands of music lovers and creators',
    'welcome.language': 'Language',

    // Auth Screen
    'auth.welcome.back': 'Welcome Back',
    'auth.join': 'Join Drezzle',
    'auth.signin.subtitle': 'Sign in to continue your musical journey',
    'auth.signup.subtitle': 'Create your account and start sharing music',
    'auth.email': 'Email',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.role.choose': 'Choose your role:',
    'auth.role.listener.description': 'Listen, like, comment and save content',
    'auth.role.creator.description': 'Publish content, interact and build your audience',
    'auth.role.expert.description': 'Like Listener + verification with music studies documents',
    'auth.role.label.description': 'Record label verified by admin',
    'auth.role.expert.note': '* Requires document verification',
    'auth.role.label.note': '* Requires admin approval',
    'auth.signin.button': 'Sign In',
    'auth.signup.button': 'Create Account',
    'auth.switch.signup': "Don't have an account? Sign up",
    'auth.switch.signin': 'Already have an account? Sign in',
    'auth.loading': 'Loading...',

    // Feed Screen
    'feed.empty': 'No content available',
    'feed.loading': 'Loading Feed...',

    // Upload Screen
    'upload.title': 'Upload Content',
    'upload.content.type': 'Content Type',
    'upload.audio': 'Audio',
    'upload.video': 'Video',
    'upload.title.label': 'Title *',
    'upload.title.placeholder': 'Give your {type} a catchy title...',
    'upload.description.label': 'Description',
    'upload.description.placeholder': 'Tell us about your {type}...',
    'upload.audio.file': 'Audio File *',
    'upload.video.file': 'Video File *',
    'upload.audio.selected': 'Audio file selected',
    'upload.video.selected': 'Video file selected',
    'upload.select.audio': 'Select audio file',
    'upload.select.video': 'Select video file',
    'upload.audio.formats': 'MP3, WAV, AAC supported',
    'upload.video.formats': 'MP4, MOV supported (max 60s)',
    'upload.cover.image': 'Cover Image',
    'upload.cover.selected': 'Cover image selected',
    'upload.cover.add': 'Add cover image',
    'upload.cover.note': 'Square images work best',
    'upload.cover.video.note': 'Optional - video thumbnail will be used if not provided',
    'upload.guidelines': 'Upload Guidelines',
    'upload.guideline.size.audio': 'Audio files up to 10MB',
    'upload.guideline.size.video': 'Video files up to 50MB (max 60s)',
    'upload.guideline.original': 'Only upload original content',
    'upload.guideline.respectful': 'Respectful content only',
    'upload.guideline.integrated': 'Video with integrated audio preferred',
    'upload.post': 'Post',
    'upload.uploading': 'Uploading...',

    // Profile Screen
    'profile.title': 'Profile',
    'profile.quick.actions': 'Quick Actions',
    'profile.settings': 'Settings',
    'profile.expert.badge': 'Request Expert Badge',
    'profile.label.status': 'Request Label Status',
    'profile.upload.content': 'Upload Content',
    'profile.notifications': 'Push Notifications',
    'profile.privacy': 'Privacy & Security',
    'profile.help': 'Help & Support',
    'profile.about': 'About',
    'profile.logout': 'Logout',

    // Comments Screen
    'comments.title': 'Comments',
    'comments.empty': 'No comments yet',
    'comments.empty.subtitle': 'Be the first to comment!',
    'comments.add.placeholder': 'Add a comment...',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.ok': 'OK',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.like': 'Like',
    'common.comment': 'Comment',
    'common.comments': 'comments',
    'common.likes': 'likes',

    // Roles
    'role.listener': 'Listener',
    'role.creator': 'Creator',
    'role.expert': 'Expert',
    'role.label': 'Label',

    // Languages
    'language.italian': 'Italian',
    'language.spanish': 'Spanish',
    'language.german': 'German',
    'language.english': 'English',
    'language.american': 'English (US)',
  },

  'en-US': {
    // Same as English for now - in the future could have US-specific terms
    // Welcome Screen
    'welcome.tagline': 'Social Music Platform',
    'welcome.discover.title': 'Discover Music',
    'welcome.discover.description': 'Swipe through endless musical content from talented creators',
    'welcome.create.title': 'Create & Share',
    'welcome.create.description': 'Upload your music and reach millions of listeners worldwide',
    'welcome.connect.title': 'Connect',
    'welcome.connect.description': 'Engage with artists, like, comment, and build your music community',
    'welcome.signin': 'Sign In',
    'welcome.signup': 'Create Account',
    'welcome.guest': 'Continue as Guest',
    'welcome.footer': 'Join thousands of music lovers and creators',
    'welcome.language': 'Language',

    // Auth Screen
    'auth.welcome.back': 'Welcome Back',
    'auth.join': 'Join Drezzle',
    'auth.signin.subtitle': 'Sign in to continue your musical journey',
    'auth.signup.subtitle': 'Create your account and start sharing music',
    'auth.email': 'Email',
    'auth.username': 'Username',
    'auth.password': 'Password',
    'auth.role.choose': 'Choose your role:',
    'auth.role.listener.description': 'Listen, like, comment and save content',
    'auth.role.creator.description': 'Publish content, interact and build your audience',
    'auth.role.expert.description': 'Like Listener + verification with music studies documents',
    'auth.role.label.description': 'Record label verified by admin',
    'auth.role.expert.note': '* Requires document verification',
    'auth.role.label.note': '* Requires admin approval',
    'auth.signin.button': 'Sign In',
    'auth.signup.button': 'Create Account',
    'auth.switch.signup': "Don't have an account? Sign up",
    'auth.switch.signin': 'Already have an account? Sign in',
    'auth.loading': 'Loading...',

    // Feed Screen
    'feed.empty': 'No content available',
    'feed.loading': 'Loading Feed...',

    // Upload Screen
    'upload.title': 'Upload Content',
    'upload.content.type': 'Content Type',
    'upload.audio': 'Audio',
    'upload.video': 'Video',
    'upload.title.label': 'Title *',
    'upload.title.placeholder': 'Give your {type} a catchy title...',
    'upload.description.label': 'Description',
    'upload.description.placeholder': 'Tell us about your {type}...',
    'upload.audio.file': 'Audio File *',
    'upload.video.file': 'Video File *',
    'upload.audio.selected': 'Audio file selected',
    'upload.video.selected': 'Video file selected',
    'upload.select.audio': 'Select audio file',
    'upload.select.video': 'Select video file',
    'upload.audio.formats': 'MP3, WAV, AAC supported',
    'upload.video.formats': 'MP4, MOV supported (max 60s)',
    'upload.cover.image': 'Cover Image',
    'upload.cover.selected': 'Cover image selected',
    'upload.cover.add': 'Add cover image',
    'upload.cover.note': 'Square images work best',
    'upload.cover.video.note': 'Optional - video thumbnail will be used if not provided',
    'upload.guidelines': 'Upload Guidelines',
    'upload.guideline.size.audio': 'Audio files up to 10MB',
    'upload.guideline.size.video': 'Video files up to 50MB (max 60s)',
    'upload.guideline.original': 'Only upload original content',
    'upload.guideline.respectful': 'Respectful content only',
    'upload.guideline.integrated': 'Video with integrated audio preferred',
    'upload.post': 'Post',
    'upload.uploading': 'Uploading...',

    // Profile Screen
    'profile.title': 'Profile',
    'profile.quick.actions': 'Quick Actions',
    'profile.settings': 'Settings',
    'profile.expert.badge': 'Request Expert Badge',
    'profile.label.status': 'Request Label Status',
    'profile.upload.content': 'Upload Content',
    'profile.notifications': 'Push Notifications',
    'profile.privacy': 'Privacy & Security',
    'profile.help': 'Help & Support',
    'profile.about': 'About',
    'profile.logout': 'Logout',

    // Comments Screen
    'comments.title': 'Comments',
    'comments.empty': 'No comments yet',
    'comments.empty.subtitle': 'Be the first to comment!',
    'comments.add.placeholder': 'Add a comment...',

    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.ok': 'OK',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.share': 'Share',
    'common.like': 'Like',
    'common.comment': 'Comment',
    'common.comments': 'comments',
    'common.likes': 'likes',

    // Roles
    'role.listener': 'Listener',
    'role.creator': 'Creator',
    'role.expert': 'Expert',
    'role.label': 'Label',

    // Languages
    'language.italian': 'Italian',
    'language.spanish': 'Spanish',
    'language.german': 'German',
    'language.english': 'English',
    'language.american': 'English (US)',
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('it'); // Default to Italian

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && savedLanguage in translations) {
        setLanguage(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang: Language) => {
    try {
      await AsyncStorage.setItem('app_language', lang);
      setLanguage(lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    const translation = translations[language]?.[key] || translations['en']?.[key] || key;
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};