// Dashboard 타입 정의

export type TabType = 'HMC' | 'KMC';
export type LangType = 'ko' | 'en';

export interface LocalizedLabel {
  ko: string;
  en: string;
}

export interface InterfaceDefinition {
  id: string;
  name: LocalizedLabel;
  params: string[];
}

export interface InputInterfaceConfig {
  type: 'create' | 'adjust';
  fields?: string[];
  headerFields?: string[];
  detailFields?: string[];
  description: LocalizedLabel;
}

export interface InterfaceConfig {
  docType: string;
  serial: string;
}

export interface PlantDefinition {
  code: string;
  name: LocalizedLabel;
}

export interface SubmitResult {
  success: boolean;
  message: string;
}

// API 응답 타입
export type DataRow = Record<string, unknown>;
