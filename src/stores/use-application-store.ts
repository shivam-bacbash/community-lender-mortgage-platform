"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type {
  Step1Input,
  Step2Input,
  Step3Input,
  Step4Input,
  Step5Input,
  Step6Input,
} from "@/lib/validations/application";

interface ApplicationStepState {
  step1: Step1Input | null;
  step2: Step2Input | null;
  step3: Step3Input | null;
  step4: Step4Input | null;
  step5: Step5Input | null;
  step6: Step6Input | null;
}

interface ApplicationStore {
  applicationId: string | null;
  currentStep: number;
  stepData: ApplicationStepState;
  setApplicationId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  setStepData: <T extends keyof ApplicationStepState>(
    step: T,
    data: ApplicationStepState[T],
  ) => void;
  hydrateDraft: (draft: {
    applicationId: string;
    stepData: Partial<ApplicationStepState>;
  }) => void;
  reset: () => void;
}

const initialStepData: ApplicationStepState = {
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  step5: null,
  step6: null,
};

export const useApplicationStore = create<ApplicationStore>()(
  persist(
    (set) => ({
      applicationId: null,
      currentStep: 1,
      stepData: initialStepData,
      setApplicationId: (id) => set({ applicationId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setStepData: (step, data) =>
        set((state) => ({
          currentStep: Math.max(
            state.currentStep,
            Number(step.replace("step", "")) || state.currentStep,
          ),
          stepData: {
            ...state.stepData,
            [step]: data,
          },
        })),
      hydrateDraft: ({ applicationId, stepData }) =>
        set((state) => ({
          applicationId,
          stepData: {
            ...state.stepData,
            ...stepData,
          },
        })),
      reset: () =>
        set({
          applicationId: null,
          currentStep: 1,
          stepData: initialStepData,
        }),
    }),
    {
      name: "borrower-application-store",
      partialize: (state) => ({
        applicationId: state.applicationId,
        currentStep: state.currentStep,
        stepData: state.stepData,
      }),
    },
  ),
);
