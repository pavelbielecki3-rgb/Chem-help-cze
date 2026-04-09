import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { FlaskConical, Search, Loader2, Beaker, Settings2, Box, RefreshCw, Layers, Maximize2, Activity } from 'lucide-react';
import * as NGL from 'ngl';
import ReactMarkdown from 'react-markdown';
import { SpectrumChart, type SpectraData } from './components/SpectrumChart';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const apparatusComponents = [
  { id: 'flask', name: 'Baňka', image: 'https://picsum.photos/seed/flask/200/200' },
  { id: 'beaker', name: 'Kádinka', image: 'https://picsum.photos/seed/beaker/200/200' },
  { id: 'burner', name: 'Kahan', image: 'https://picsum.photos/seed/burner/200/200' },
  { id: 'condenser', name: 'Chladič', image: 'https://picsum.photos/seed/condenser/200/200' },
  { id: 'stand', name: 'Stojan', image: 'https://picsum.photos/seed/stand/200/200' },
  { id: 'adapter', name: 'Koleno/Adaptér', image: 'https://picsum.photos/seed/adapter/200/200' },
  { id: 'funnel', name: 'Nálevka', image: 'https://picsum.photos/seed/funnel/200/200' },
  { id: 'thermometer', name: 'Teploměr', image: 'https://picsum.photos/seed/thermometer/200/200' },
];

function MolecularViewer({ smiles, name }: { smiles?: string; name?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<NGL.Stage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [representation, setRepresentation] = useState<'ball+stick' | 'spacefill' | 'licorice' | 'cartoon'>('ball+stick');

  useEffect(() => {
    if (!containerRef.current) return;

    stageRef.current = new NGL.Stage(containerRef.current, { backgroundColor: "white" });

    const handleResize = () => {
      stageRef.current?.handleResize();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      stageRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const loadMolecule = async () => {
      if (!stageRef.current || (!smiles && !name)) return;
      
      setLoading(true);
      setError(null);
      stageRef.current.removeAllComponents();

      try {
        let url = "";
        let fallbackUrl = "";

        if (smiles) {
          url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`;
          fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF`;
        } else if (name) {
          // Try to get CID first for better reliability
          try {
            const cidRes = await fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/cids/JSON`);
            if (cidRes.ok) {
              const cidData = await cidRes.json();
              const cid = cidData.IdentifierList?.CID?.[0];
              if (cid) {
                url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=3d`;
                fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF`;
              }
            }
          } catch (e) {
            console.warn("CID search failed", e);
          }

          if (!url) {
            url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF?record_type=3d`;
            fallbackUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/SDF`;
          }
        }

        let response = await fetch(url);
        
        // Fallback to 2D if 3D record is not available
        if (!response.ok && fallbackUrl) {
          response = await fetch(fallbackUrl);
        }

        if (!response.ok) throw new Error("Molekula nebyla nalezena v databázi PubChem.");
        
        const blob = await response.blob();
        const component = await stageRef.current.loadFile(blob, { ext: "sdf" });
        if (component) {
          (component as any).addRepresentation(representation);
        }
        stageRef.current.autoView();
      } catch (err) {
        console.error("Chyba při načítání molekuly:", err);
        setError("Nepodařilo se načíst 3D strukturu. Zkuste jiný název nebo vzorec.");
      } finally {
        setLoading(false);
      }
    };

    loadMolecule();
  }, [smiles, name, representation]);

  return (
    <div className="relative w-full h-[450px] bg-white rounded-xl border border-neutral-200 overflow-hidden shadow-inner group">
      <div ref={containerRef} className="w-full h-full" />
      
      {/* Controls Overlay */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="flex flex-col bg-white/90 backdrop-blur-md p-1 rounded-lg border border-neutral-200 shadow-sm">
          <button 
            onClick={() => setRepresentation('ball+stick')}
            className={`p-1.5 rounded ${representation === 'ball+stick' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-neutral-100 text-neutral-600'}`}
            title="Ball & Stick"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setRepresentation('spacefill')}
            className={`p-1.5 rounded ${representation === 'spacefill' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-neutral-100 text-neutral-600'}`}
            title="Spacefill"
          >
            <Box className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setRepresentation('licorice')}
            className={`p-1.5 rounded ${representation === 'licorice' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-neutral-100 text-neutral-600'}`}
            title="Licorice"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg border border-red-100">{error}</p>
        </div>
      )}
      
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-widest bg-white/80 px-2 py-1 rounded border border-neutral-100">
          {name || (smiles ? 'SMILES' : '3D View')}
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [formula, setFormula] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [visualizeMolecule, setVisualizeMolecule] = useState<{ smiles?: string; name?: string } | null>(null);

  const [chemicals, setChemicals] = useState<string[]>(['', '']);
  const [mixResult, setMixResult] = useState('');
  const [mixLoading, setMixLoading] = useState(false);

  const [selectedApparatus, setSelectedApparatus] = useState<typeof apparatusComponents>([]);
  const [experimentChemicals, setExperimentChemicals] = useState('');
  const [temperature, setTemperature] = useState('');
  const [pressure, setPressure] = useState('');
  const [concentration, setConcentration] = useState('');
  const [duration, setDuration] = useState('');
  const [protocol, setProtocol] = useState('');
  const [experimentResult, setExperimentResult] = useState('');
  const [experimentLoading, setExperimentLoading] = useState(false);
  const [reactionState, setReactionState] = useState<'idle' | 'running' | 'complete'>('idle');

  const [manualMolecule, setManualMolecule] = useState('');
  const [spectraData, setSpectraData] = useState<SpectraData | null>(null);

  const extractSmiles = (text: string) => {
    // Improved regex to handle various formats and exclude trailing punctuation
    const match = text.match(/\[SMILES:\s*([^\]\s.,;]+)\]/i);
    return match ? match[1].trim() : null;
  };

  const extractSpectra = (text: string): SpectraData | null => {
    const match = text.match(/\[SPECTRA:\s*({[\s\S]*?})\]/i);
    if (match) {
      try {
        return JSON.parse(match[1]);
      } catch (e) {
        console.error("Failed to parse spectra JSON:", e);
      }
    }
    return null;
  };

  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\[SMILES:\s*[^\]]+\]/gi, '')
      .replace(/\[SPECTRA:\s*{[\s\S]*?}\]/gi, '')
      .trim();
  };

  const runExperiment = async () => {
    if (selectedApparatus.length === 0 || !experimentChemicals.trim()) return;
    setExperimentLoading(true);
    setReactionState('running');
    setExperimentResult('');

    const apparatusNames = selectedApparatus.map(c => c.name).join(', ');

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Proveď vysoce detailní vědeckou simulaci chemického pokusu na základě oficiálních vědeckých dat a literatury.
        Aparatura: ${apparatusNames}.
        Přidané chemikálie: ${experimentChemicals}.
        Teplota: ${temperature}.
        Tlak: ${pressure}.
        Koncentrace: ${concentration}.
        Doba trvání: ${duration}.
        Protokol: ${protocol}.
        
        Zaměř se na technickou přesnost a hloubku, ale přidej i srozumitelný výklad:
        1. Teoretický základ: Termodynamika a kinetika reakce, reakční mechanismus (krok za krokem).
        2. Stechiometrie a Výpočty: Molární poměry, teoretický výtěžek, energetická bilance.
        3. Instrumentální analýza a srozumitelný výklad: Jaké analytické metody (NMR, IR, MS) by byly použity. U každé hodnoty (např. chemický posun v NMR) uveď v závorce "lidské" vysvětlení (např. "tato hodnota 206 ppm značí přítomnost C=O skupiny"). Vyhni se složitému formátování v LaTeXu, používej přehledné odrážky a symbol 'delta' piš slovem nebo jako 'δ'.
        4. Fyzikálně-chemické vlastnosti: Detailní data o produktech z oficiálních databází.
        
        Informace čerpej z oficiálních zdrojů jako PubChem, ChemSpider, NIST Chemistry WebBook nebo odborné literatury.
        
        Na konci odpovědi uveď SMILES řetězec hlavního produktu ve formátu [SMILES: řetězec].
        DŮLEŽITÉ: Na úplný konec odpovědi přidej také strukturovaná spektrální data pro vizualizaci v grafech ve formátu [SPECTRA: JSON_OBJEKT]. 
        JSON_OBJEKT musí mít strukturu: {"ir": [{"x": vlnočet, "y": transmitance, "label": "popis"}], "nmr1h": [{"x": posun, "y": intenzita, "label": "popis"}], "nmr13c": [{"x": posun, "y": intenzita, "label": "popis"}], "ms": [{"x": mz, "y": abundance, "label": "popis"}]}. 
        Uveď alespoň 5-10 nejvýznamnějších píků pro každé spektrum.
        
        Odpověď udržuj vysoce odbornou, ale v částech s výsledky srozumitelnou pro lidi, strukturovanou a technicky bohatou v češtině.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const text = response.text || '';
      setExperimentResult(text);
      const smiles = extractSmiles(text);
      if (smiles) setVisualizeMolecule({ smiles });
      
      const spectra = extractSpectra(text);
      if (spectra) setSpectraData(spectra);

      setReactionState('complete');
      setTimeout(() => setReactionState('idle'), 3000);
    } catch (error) {
      console.error('Chyba při simulaci pokusu:', error);
      setExperimentResult('Při simulaci pokusu došlo k chybě. Zkuste to prosím znovu.');
      setReactionState('idle');
    } finally {
      setExperimentLoading(false);
    }
  };

  const analyzeFormula = async () => {
    if (!formula.trim()) return;
    setLoading(true);
    setResult('');
    setVisualizeMolecule(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Proveď komplexní technickou analýzu chemického vzorce: ${formula} s využitím oficiálních vědeckých zdrojů.
        
        Struktura odpovědi (zaměřeno na vědecká data, s lidským vysvětlením u technických detailů):
        1. Identifikace a Názvosloví: Systematický název (IUPAC), triviální názvy, registrační čísla (CAS, PubChem CID).
        2. Strukturní a Molekulární data: Molekulová hmotnost, sumární a strukturní vzorec, hybridizace atomů.
        3. Fyzikální konstanty: Přesné hodnoty bodu tání, varu, hustoty, rozpustnosti a pKa.
        4. Chemická reaktivita a Syntéza: Detailní popis reakčních center, mechanismy syntézy.
        5. Spektroskopická data a srozumitelný výklad: Charakteristické píky v IR, NMR (1H, 13C) a MS. U každé hodnoty (např. delta 206 ppm) přidej jednoduché vysvětlení, co to v molekule znamená (např. "značí to přítomnost C=O skupiny"). Nepoužívej LaTeXové značky jako $...$, piš přehledně v odrážkách. Symbol delta piš jako 'δ' nebo slovem.
        6. Využití ve výzkumu a průmyslu: Specifické aplikace.
        
        Informace čerpej výhradně z oficiálních zdrojů (PubChem, NIST, Sigma-Aldrich SDS, odborné časopisy).
        
        Na konci odpovědi uveď SMILES řetězec analyzované látky ve formátu [SMILES: řetězec].
        DŮLEŽITÉ: Na úplný konec odpovědi přidej také strukturovaná spektrální data pro vizualizaci v grafech ve formátu [SPECTRA: JSON_OBJEKT]. 
        JSON_OBJEKT musí mít strukturu: {"ir": [{"x": vlnočet, "y": transmitance, "label": "popis"}], "nmr1h": [{"x": posun, "y": intenzita, "label": "popis"}], "nmr13c": [{"x": posun, "y": intenzita, "label": "popis"}], "ms": [{"x": mz, "y": abundance, "label": "popis"}]}. 
        Uveď alespoň 5-10 nejvýznamnějších píků pro každé spektrum.
        
        Odpověď udržuj vysoce odbornou, ale v technických pasážích srozumitelnou, vědecky přesnou a technicky bohatou v češtině.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const text = response.text || '';
      setResult(text);
      const smiles = extractSmiles(text);
      if (smiles) setVisualizeMolecule({ smiles });
      else setVisualizeMolecule({ name: formula });

      const spectra = extractSpectra(text);
      if (spectra) setSpectraData(spectra);
    } catch (error) {
      console.error('Chyba při analýze vzorce:', error);
      setResult('Při analýze vzorce došlo k chybě. Zkuste to prosím znovu.');
    } finally {
      setLoading(false);
    }
  };

  const mixChemicals = async () => {
    const validChemicals = chemicals.filter(c => c.trim() !== '');
    if (validChemicals.length < 2) return;
    setMixLoading(true);
    setMixResult('');
    setVisualizeMolecule(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Simuluj interakci mezi následujícími chemikáliemi: ${validChemicals.join(', ')} na základě oficiálních vědeckých dat.
        
        Analýza interakce (zaměřeno na chemii s lidským výkladem):
        1. Charakteristika reaktantů: Technická data o všech zúčastněných látkách.
        2. Reakční mechanismus: Detailní popis na molekulární úrovni, včetně možných vedlejších reakcí.
        3. Termodynamika: Výpočet reakční entalpie (ΔH) a Gibbsovy volné energie (ΔG) pro hlavní reakci.
        4. Produkty a analytické ověření: Přesná stechiometrie a jak by se produkty ověřily (NMR, IR). U spektroskopických dat vysvětli lidsky, co znamenají (např. "posun δ 206 ppm značí vznik C=O vazby"). Nepoužívej LaTeXové značky $...$, piš přehledně.
        
        Informace čerpej z oficiálních zdrojů jako PubChem, NIST nebo vědecké publikace.
        
        Na konci odpovědi uveď SMILES řetězec hlavního produktu ve formátu [SMILES: řetězec].
        DŮLEŽITÉ: Na úplný konec odpovědi přidej také strukturovaná spektrální data pro vizualizaci v grafech ve formátu [SPECTRA: JSON_OBJEKT]. 
        JSON_OBJEKT musí mít strukturu: {"ir": [{"x": vlnočet, "y": transmitance, "label": "popis"}], "nmr1h": [{"x": posun, "y": intenzita, "label": "popis"}], "nmr13c": [{"x": posun, "y": intenzita, "label": "popis"}], "ms": [{"x": mz, "y": abundance, "label": "popis"}]}. 
        Uveď alespoň 5-10 nejvýznamnějších píků pro každé spektrum.
        
        Odpověď poskytni v češtině a udržuj ji vysoce odbornou, ale srozumitelnou v závěrech, vědecky přesnou a technicky bohatou.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });
      const text = response.text || '';
      setMixResult(text);
      const smiles = extractSmiles(text);
      if (smiles) setVisualizeMolecule({ smiles });

      const spectra = extractSpectra(text);
      if (spectra) setSpectraData(spectra);
    } catch (error) {
      console.error('Chyba při míchání chemikálií:', error);
      setMixResult('Při míchání došlo k chybě. Zkuste to prosím znovu.');
    } finally {
      setMixLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-indigo-600" />
          <h1 className="text-3xl font-bold tracking-tight">ChemHelper Pro</h1>
        </div>
        <p className="text-sm text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
          Vědecký výzkum a studium: Data z oficiálních zdrojů
        </p>
      </header>

      <main className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          {/* Formula Analysis Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4">Analýza vzorce</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Zadejte chemický vzorec (např. HCl, H2O)"
                className="flex-grow p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <button
                onClick={analyzeFormula}
                disabled={loading}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                Analyzovat
              </button>
            </div>
          </div>

          {result && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-semibold mb-4">Výsledek analýzy</h2>
              <div className="markdown-body prose prose-neutral max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{cleanMarkdown(result)}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Mixing Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Beaker className="w-6 h-6 text-indigo-600" />
              Simulátor míchání chemikálií
            </h2>
            <div className="flex flex-col gap-3">
              {chemicals.map((chem, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={chem}
                    onChange={(e) => {
                      const newChemicals = [...chemicals];
                      newChemicals[index] = e.target.value;
                      setChemicals(newChemicals);
                    }}
                    placeholder={`Chemikálie ${index + 1}`}
                    className="flex-grow p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                  {chemicals.length > 2 && (
                    <button
                      onClick={() => {
                        const newChemicals = chemicals.filter((_, i) => i !== index);
                        setChemicals(newChemicals);
                      }}
                      className="p-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Odebrat"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              
              <button
                onClick={() => setChemicals([...chemicals, ''])}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 self-start px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
              >
                + Přidat další chemikálii
              </button>

              <button
                onClick={mixChemicals}
                disabled={mixLoading || chemicals.filter(c => c.trim() !== '').length < 2}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {mixLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Beaker className="w-5 h-5" />}
                Smíchat chemikálie
              </button>
            </div>
          </div>

          {mixResult && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-semibold mb-4">Výsledek míchání</h2>
              <div className="markdown-body prose prose-neutral max-w-none text-sm leading-relaxed">
                <ReactMarkdown>{cleanMarkdown(mixResult)}</ReactMarkdown>
              </div>
            </div>
          )}

          {spectraData && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-600" />
                Interaktivní spektrální analýza
              </h2>
              <SpectrumChart data={spectraData} />
            </div>
          )}

          {/* Apparatus Builder Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Settings2 className="w-6 h-6 text-indigo-600" />
              Sestavování aparatury
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {apparatusComponents.map((comp) => (
                <button
                  key={comp.id}
                  onClick={() => setSelectedApparatus([...selectedApparatus, comp])}
                  className="flex flex-col items-center p-3 border border-neutral-200 rounded-lg hover:border-indigo-500 transition-colors"
                >
                  <img 
                    src={comp.image} 
                    alt={comp.name} 
                    className="w-16 h-16 mb-2 rounded" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://placehold.co/200x200?text=Error';
                    }}
                  />
                  <span className="text-sm font-medium">{comp.name}</span>
                </button>
              ))}
            </div>
            
            <h3 className="text-lg font-semibold mb-2">Vaše aparatura</h3>
            <div className="flex flex-wrap gap-2 min-h-[100px] p-4 border-2 border-dashed border-neutral-200 rounded-lg mb-4 relative overflow-hidden">
              {selectedApparatus.length === 0 && <p className="text-neutral-400 text-sm">Vyberte komponenty pro sestavení aparatury.</p>}
              {selectedApparatus.map((comp, index) => (
                <div key={index} className="flex flex-col items-center p-2 bg-neutral-100 rounded">
                  <img 
                    src={comp.image} 
                    alt={comp.name} 
                    className="w-12 h-12 mb-1 rounded" 
                  />
                  <span className="text-xs">{comp.name}</span>
                </div>
              ))}
              
              {reactionState !== 'idle' && (
                <div className={`absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm transition-all duration-500 ${reactionState === 'running' ? 'opacity-100' : 'opacity-0'}`}>
                  <div className={`w-24 h-24 rounded-full border-4 border-indigo-500 animate-pulse ${reactionState === 'running' ? 'bg-indigo-200' : 'bg-green-200'} transition-colors duration-1000`}>
                    <div className="w-full h-full flex items-center justify-center">
                      {reactionState === 'running' ? 'Reakce...' : 'Hotovo!'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <input
                type="text"
                value={experimentChemicals}
                onChange={(e) => setExperimentChemicals(e.target.value)}
                placeholder="Zadejte chemikálie pro pokus (např. HCl, NaOH)"
                className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="Teplota (např. 25°C)"
                  className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={pressure}
                  onChange={(e) => setPressure(e.target.value)}
                  placeholder="Tlak (např. 1 atm)"
                  className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={concentration}
                  onChange={(e) => setConcentration(e.target.value)}
                  placeholder="Koncentrace (např. 1M)"
                  className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Doba trvání (např. 10 min)"
                  className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                />
              </div>
              <textarea
                value={protocol}
                onChange={(e) => setProtocol(e.target.value)}
                placeholder="Vlastní protokol (volitelné)"
                className="p-3 rounded-lg border border-neutral-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[100px]"
              />
              <button
                onClick={runExperiment}
                disabled={experimentLoading || selectedApparatus.length === 0 || !experimentChemicals.trim()}
                className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                {experimentLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Beaker className="w-5 h-5" />}
                Spustit pokus
              </button>
            </div>

            {experimentResult && (
              <div className="bg-neutral-100 p-4 rounded-lg mt-4">
                <h4 className="font-semibold mb-2">Výsledek pokusu</h4>
                <div className="markdown-body prose prose-neutral max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{cleanMarkdown(experimentResult)}</ReactMarkdown>
                </div>
              </div>
            )}

            <button 
              onClick={() => { setSelectedApparatus([]); setExperimentChemicals(''); setExperimentResult(''); }}
              className="mt-4 text-sm text-red-600 hover:text-red-700"
            >
              Vymazat aparaturu
            </button>
          </div>
        </div>

        {/* Sidebar with 3D Visualizer */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-8 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Box className="w-6 h-6 text-indigo-600" />
                3D Vizualizace molekul
              </h2>
              <MolecularViewer smiles={visualizeMolecule?.smiles} name={visualizeMolecule?.name} />
              <div className="mt-4 space-y-2">
                <p className="text-xs text-neutral-500 italic">
                  Tip: Molekulu můžete otáčet tažením myši, přibližovat kolečkem a posouvat pravým tlačítkem.
                </p>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-neutral-700">Ruční zadání (SMILES nebo Název):</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={manualMolecule}
                      onChange={(e) => setManualMolecule(e.target.value)}
                      placeholder="např. C1=CC=CC=C1 nebo Benzene"
                      className="flex-grow text-xs p-2 rounded border border-neutral-300 outline-none focus:ring-1 focus:ring-indigo-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && manualMolecule.trim()) {
                          setVisualizeMolecule({ name: manualMolecule });
                        }
                      }}
                    />
                    <button 
                      onClick={() => manualMolecule.trim() && setVisualizeMolecule({ name: manualMolecule })}
                      className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 transition-colors"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
              <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-2">O vizualizaci</h3>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Tento vizualizátor využívá knihovnu NGL a databázi PubChem k zobrazení 3D struktur. 
                AI automaticky extrahuje SMILES řetězce z vašich analýz a experimentů pro okamžité zobrazení.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
