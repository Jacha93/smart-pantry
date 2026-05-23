/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_DISABLED?: string;
  readonly VITE_USE_MOCK_AUTH?: string;
  readonly VITE_ADSENSE_PUBLISHER_ID?: string;
  readonly VITE_ADSENSE_AD_SLOT_RECTANGLE?: string;
  readonly VITE_ADSENSE_AD_SLOT_HORIZONTAL?: string;
  readonly VITE_ADSENSE_AD_SLOT_VERTICAL?: string;
  readonly VITE_ADSENSE_ENABLED?: string;
  readonly VITE_ADSENSE_CONSENT_GRANTED?: string;
  readonly VITE_SHOW_ADS_FOR_ALL?: string;
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
