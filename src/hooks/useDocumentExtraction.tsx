import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./use-toast";
import { DocumentFieldSchema, ExtractionResult } from "@/types/document-extraction";

export function useDocumentExtraction() {
  const [extracting, setExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const { toast } = useToast();

  const extractDocumentData = async (
    documentUrl: string,
    documentName: string,
    aceleradorKey: string,
    expectedFields: DocumentFieldSchema[],
    contextoProyecto?: any
  ): Promise<ExtractionResult | null> => {
    try {
      setExtracting(true);
      setExtractionResult(null);

      const { data, error } = await supabase.functions.invoke('extract-document-data', {
        body: {
          documentUrl,
          documentName,
          aceleradorKey,
          expectedFields,
          contexto_proyecto: contextoProyecto
        }
      });

      if (error) throw error;

      if (data.success) {
        setExtractionResult(data as ExtractionResult);
        
        toast({
          title: "Extracción completada",
          description: `Se extrajeron ${data.fieldsFound.length} campos del documento`
        });

        return data as ExtractionResult;
      } else {
        throw new Error(data.error || "Error en la extracción");
      }
    } catch (error: any) {
      console.error('Error extracting document:', error);
      toast({
        title: "Error en la extracción",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setExtracting(false);
    }
  };

  const clearExtraction = () => {
    setExtractionResult(null);
  };

  return {
    extracting,
    extractionResult,
    extractDocumentData,
    clearExtraction
  };
}
