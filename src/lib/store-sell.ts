import { create } from "zustand";
import type { CapturedPhoto } from "@/hooks/use-camera-capture";

export type SellStep = 1 | 2 | 3 | 4;

interface AIResult {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  price: number;
  category: string;
  tags: string[];
  condition: string;
}

interface SellState {
  step: SellStep;
  direction: number;

  // Step 1: Voice
  transcript: string;
  audioBlob: Blob | null;

  // Step 2: Photos
  photos: CapturedPhoto[];
  uploadedUrls: string[];

  // Step 3: AI result
  aiResult: AIResult | null;
  aiLoading: boolean;
  aiError: string | null;

  // Step 4: Publishing
  publishing: boolean;
  published: boolean;
  listingId: string | null;

  // Location
  lat: number | null;
  lng: number | null;

  // Actions
  setStep: (step: SellStep, direction: number) => void;
  setTranscript: (t: string) => void;
  setAudioBlob: (b: Blob | null) => void;
  addPhoto: (p: CapturedPhoto) => void;
  removePhoto: (i: number) => void;
  setUploadedUrls: (urls: string[]) => void;
  setAIResult: (r: AIResult | null) => void;
  setAILoading: (l: boolean) => void;
  setAIError: (e: string | null) => void;
  setPublishing: (p: boolean) => void;
  setPublished: (p: boolean, id?: string) => void;
  setLocation: (lat: number | null, lng: number | null) => void;
  updateAIField: (field: keyof AIResult, value: string | number | string[]) => void;
  reset: () => void;
}

const initialState = {
  step: 1 as SellStep,
  direction: 0,
  transcript: "",
  audioBlob: null,
  photos: [],
  uploadedUrls: [],
  aiResult: null,
  aiLoading: false,
  aiError: null,
  publishing: false,
  published: false,
  listingId: null,
  lat: null,
  lng: null,
};

export const useSellStore = create<SellState>()((set) => ({
  ...initialState,

  setStep: (step, direction) => set({ step, direction }),
  setTranscript: (transcript) => set({ transcript }),
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  addPhoto: (photo) => set((s) => ({ photos: [...s.photos, photo] })),
  removePhoto: (i) => set((s) => ({ photos: s.photos.filter((_, idx) => idx !== i) })),
  setUploadedUrls: (uploadedUrls) => set({ uploadedUrls }),
  setAIResult: (aiResult) => set({ aiResult }),
  setAILoading: (aiLoading) => set({ aiLoading }),
  setAIError: (aiError) => set({ aiError }),
  setPublishing: (publishing) => set({ publishing }),
  setPublished: (published, listingId) => set({ published, listingId: listingId ?? null }),
  setLocation: (lat, lng) => set({ lat, lng }),
  updateAIField: (field, value) =>
    set((s) => ({
      aiResult: s.aiResult ? { ...s.aiResult, [field]: value } : null,
    })),
  reset: () => set(initialState),
}));
