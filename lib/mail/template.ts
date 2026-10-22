export const TEMPLATE_VARIABLES = ['nom', 'import', 'periode', 'nº_factura'] as const;
export type TemplateVariable = (typeof TEMPLATE_VARIABLES)[number];

export type TemplateVariables = Partial<Record<TemplateVariable, string>>;

/**
 * Substitueix les variables {{nom}}, {{import}}, {{periode}} i {{nº_factura}}
 * dins d'un text de plantilla. Les variables sense valor es deixen en blanc
 * (mai es mostra "{{...}}" sense substituir a un correu real).
 */
export function substituteVariables(text: string, vars: TemplateVariables): string {
  return text.replace(/\{\{\s*([a-zA-Zà-ú0-9_º]+)\s*\}\}/g, (match, key: string) => {
    const value = vars[key as TemplateVariable];
    return value !== undefined ? value : '';
  });
}

export interface MemberLike {
  name: string;
}

/** Variables d'exemple per mostrar una previsualització amb un soci fictici. */
export function sampleVariables(memberName: string): TemplateVariables {
  return {
    nom: memberName,
    import: '25,00',
    periode: '2026',
    'nº_factura': '2026-0001',
  };
}
