export interface DocumentFieldSchema {
  fieldName: string;
  label: string;
  type: 'text' | 'textarea' | 'list' | 'number' | 'boolean';
  description: string;
  maxLength?: number;
  listItemType?: 'string' | 'object';
  objectFields?: DocumentFieldSchema[];
}

export interface ExtractionResult {
  success: boolean;
  extractedData: Record<string, any>;
  confidence: Record<string, number>;
  fieldsFound: string[];
  fieldsMissing: string[];
  warnings: string[];
  documentAnalysis: {
    pageCount?: number;
    wordCount?: number;
    language: string;
    fileType: string;
  };
}

export interface DocumentExtraction {
  id: string;
  proyecto_id: string;
  acelerador_key: string;
  document_url: string;
  document_name: string;
  extracted_fields: string[];
  extraction_result: ExtractionResult;
  created_at: string;
}
