import { slugifyMaterialName } from "../utils/permalinks";
import { projectId } from "../utils/supabase/info";

const MATERIAL_DOODLE_BUCKET = "make-17cae920-assets";
const MATERIAL_DOODLE_PREFIX = "material-doodles";

export interface MaterialDoodle {
  materialId: string;
  imageFile: string;
  alt?: string;
  publicUrl: string;
}

type MaterialDoodleManifestEntry = {
  imageFile: string;
  alt?: string;
};

const encodeStoragePath = (path: string) =>
  path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

export const buildMaterialDoodlePublicUrl = (imageFile: string) => {
  const storagePath = imageFile.startsWith(`${MATERIAL_DOODLE_PREFIX}/`)
    ? imageFile
    : `${MATERIAL_DOODLE_PREFIX}/${imageFile}`;

  return `https://${projectId}.supabase.co/storage/v1/object/public/${MATERIAL_DOODLE_BUCKET}/${encodeStoragePath(
    storagePath,
  )}`;
};

export const MATERIAL_DOODLES: Record<string, MaterialDoodleManifestEntry> = {
  // Add generated Excel/CSV mappings here:
  // "material-id": { imageFile: "material-id.webp", alt: "Doodle of material name" },
  // Prefixed paths copied from admin also work: "material-doodles/material-id.webp"
  "3d-printing-filament": {
    imageFile: "material-doodles/image1-1782251808325.png",
    alt: "Line drawing of a spool of 3D printing filament",
  },

  actinium: { imageFile: "image2-1782254090149.png", alt: "actinium" },
  "Aerosol-cans": {
    imageFile: "image3-1782254424666.png",
    alt: "Line drawing of an aerosol can",
  },
  "alkaline-batteries": {
    imageFile: "image4-1782254586484.png",
    alt: "Line drawing of an alkaline battery",
  },
  aluminum: {
    imageFile: "image5-1782254690322.png",
    alt: "Line drawing of aluminum's chemical element symbol",
  },
  "aluminum-can": {
    imageFile: "image6-1782255011966.png",
    alt: "aluminum-can",
  },
  "aluminum-foil": {
    imageFile: "image7-1782255020032.png",
    alt: "aluminum-foil",
  },
  americium: {
    imageFile: "image8-1782255025440.png",
    alt: "Line drawing of americium's chemical element symbol",
  },
  antimony: {
    imageFile: "image9-1782255031767.png",
    alt: "Line drawing of antimony's chemical element symbol",
  },
  argon: { imageFile: "image10-1782255035873.png", alt: "argon" },
  arsenic: { imageFile: "image11-1782255041651.png", alt: "arsenic" },
  "asphalt-shingle": {
    imageFile: "image12-1782255046693.png",
    alt: "asphalt-shingle",
  },
  astatine: { imageFile: "image13-1782255052029.png", alt: "astatine" },
  barium: { imageFile: "image14-1782255058811.png", alt: "barium" },
  beads: { imageFile: "image15-1782255064970.png", alt: "beads" },
  berkelium: { imageFile: "image16-1782255070724.png", alt: "berkelium" },
  beryllium: { imageFile: "image17-1782255076471.png", alt: "beryllium" },
  bismuth: { imageFile: "image18-1782255083521.png", alt: "bismuth" },
  bohrium: { imageFile: "image19-1782255088451.png", alt: "bohrium" },
  boron: { imageFile: "image20-1782255093955.png", alt: "boron" },
  "broken-glass": {
    imageFile: "image21-1782255099582.png",
    alt: "broken-glass",
  },
  bromine: { imageFile: "image22-1782255104674.png", alt: "bromine" },
  cadmium: { imageFile: "image23-1782255112143.png", alt: "cadmium" },
  calcium: { imageFile: "image24-1782255117185.png", alt: "calcium" },
  californium: { imageFile: "image25-1782255123107.png", alt: "californium" },
  carbon: { imageFile: "image26-1782255128866.png", alt: "carbon" },
  "card-stock": { imageFile: "image27-1782255134855.png", alt: "card-stock" },
  cardboard: { imageFile: "image28-1782255140839.png", alt: "cardboard" },
  "cardboard-box": {
    imageFile: "image29-1782255146512.png",
    alt: "cardboard-box",
  },
  "ceramic-tile": {
    imageFile: "image30-1782255154562.png",
    alt: "ceramic-tile",
  },
  ceramics: { imageFile: "image31-1782255178509.png", alt: "ceramics" },
  cerium: { imageFile: "image32-1782255185200.png", alt: "cerium" },
  cesium: { imageFile: "image33-1782255192159.png", alt: "cesium" },
  chlorine: { imageFile: "image34-1782255199042.png", alt: "chlorine" },
  chromium: { imageFile: "image35-1782255205764.png", alt: "chromium" },
  "clamshell-packaging": {
    imageFile: "image36-1782255214672.png",
    alt: "clamshell-packaging",
  },
  "clear-glass-bottle": {
    imageFile: "image37-1782255223613.png",
    alt: "clear-glass-bottle",
  },
  "clothes-hanger": {
    imageFile: "image38-1782255229514.png",
    alt: "clothes-hanger",
  },
  cobalt: { imageFile: "image39-1782255236807.png", alt: "cobalt" },
  "coffee-grounds": {
    imageFile: "image40-1782255241711.png",
    alt: "coffee-grounds",
  },
  "colored-glass-bottle": {
    imageFile: "image41-1782255247552.png",
    alt: "colored-glass-bottle",
  },
  "compact-fluorescent-lamp": {
    imageFile: "image42-1782255255164.png",
    alt: "compact-fluorescent-lamp",
  },
  "concrete-rubble": {
    imageFile: "image43-1782255264414.png",
    alt: "concrete-rubble",
  },
  "contact-lens": {
    imageFile: "image44-1782255272306.png",
    alt: "contact-lens",
  },
  copernicium: { imageFile: "image45-1782255278247.png", alt: "copernicium" },
  copper: { imageFile: "image46-1782255285804.png", alt: "copper" },
  "copper-wire": { imageFile: "image47-1782255294546.png", alt: "copper-wire" },
  cork: { imageFile: "image48-1782255301335.png", alt: "cork" },
  "cotton-t-shirt": {
    imageFile: "image49-1782255307681.png",
    alt: "cotton-t-shirt",
  },
  "crystal-glass": {
    imageFile: "image50-1782255313002.png",
    alt: "crystal-glass",
  },
  curium: { imageFile: "image51.png", alt: "curium" },
  darmstadtium: { imageFile: "image52.png", alt: "darmstadtium" },
  "denim-jeans": { imageFile: "image53.png", alt: "denim-jeans" },
  "dental-floss": { imageFile: "image54.png", alt: "dental-floss" },
  "disposable-razor": { imageFile: "image55.png", alt: "disposable-razor" },
  "dryer-lint": { imageFile: "image56.png", alt: "dryer-lint" },
  drywall: { imageFile: "image57.png", alt: "drywall" },
  dubnium: { imageFile: "image58.png", alt: "dubnium" },
  dysprosium: { imageFile: "image59.png", alt: "dysprosium" },
  "egg-carton-(paper)": { imageFile: "image60.png", alt: "egg-carton-(paper)" },
  eggshells: { imageFile: "image61.png", alt: "eggshells" },
  einsteinium: { imageFile: "image62.png", alt: "einsteinium" },
  "electronics-cables": { imageFile: "image63.png", alt: "electronics-cables" },
  "epoxy-resins": { imageFile: "image64.png", alt: "epoxy-resins" },
  erbium: { imageFile: "image65.png", alt: "erbium" },
  europium: { imageFile: "image66.png", alt: "europium" },
  fermium: { imageFile: "image67.png", alt: "fermium" },
  fiberglass: { imageFile: "image68.png", alt: "fiberglass" },
  flerovium: { imageFile: "image69.png", alt: "flerovium" },
  fluorine: { imageFile: "image70.png", alt: "fluorine" },
  "food-scraps": { imageFile: "image71.png", alt: "food-scraps" },
  bones: { imageFile: "image72.png", alt: "bones" },
  francium: { imageFile: "image73.png", alt: "francium" },
  gadolinium: { imageFile: "image74.png", alt: "gadolinium" },
  gallium: { imageFile: "image75.png", alt: "gallium" },
  germanium: { imageFile: "image76.png", alt: "germanium" },
  glass: { imageFile: "image77.png", alt: "glass" },
  "glass-jar": { imageFile: "image78.png", alt: "glass-jar" },
  gold: { imageFile: "image79.png", alt: "gold" },
  granite: { imageFile: "image80.png", alt: "granite" },
  "grass/grass-clippings": {
    imageFile: "image81.png",
    alt: "grass/grass-clippings",
  },
  hafnium: { imageFile: "image82.png", alt: "hafnium" },
  hassium: { imageFile: "image83.png", alt: "hassium" },
  "hdpe-plastic-container": {
    imageFile: "image84.png",
    alt: "hdpe-plastic-container",
  },
  helium: { imageFile: "image85.png", alt: "helium" },
  holmium: { imageFile: "image86.png", alt: "holmium" },
  hydrogels: { imageFile: "image87.png", alt: "hydrogels" },
  hydrogen: { imageFile: "image88.png", alt: "hydrogen" },
  "incandescent-bulb": { imageFile: "image89.png", alt: "incandescent-bulb" },
  indium: { imageFile: "image90.png", alt: "indium" },
  iodine: { imageFile: "image91.png", alt: "iodine" },
  iridium: { imageFile: "image92.png", alt: "iridium" },
  iron: { imageFile: "image93.png", alt: "iron" },
  krypton: { imageFile: "image94.png", alt: "krypton" },
  "laminate-tubes": { imageFile: "image95.png", alt: "laminate-tubes" },
  lanthanum: { imageFile: "image96.png", alt: "lanthanum" },
  "laptop-computer": { imageFile: "image97.png", alt: "laptop-computer" },
  lawrencium: { imageFile: "image98.png", alt: "lawrencium" },
  "ldpe-plastic-bag": { imageFile: "image99.png", alt: "ldpe-plastic-bag" },
  lead: { imageFile: "image100.png", alt: "lead" },
  "lead-crystal-glass": {
    imageFile: "image101.png",
    alt: "lead-crystal-glass",
  },
  "leather-goods": { imageFile: "image102.png", alt: "leather-goods" },
  "led-light-bulb": { imageFile: "image103.png", alt: "led-light-bulb" },
  lithium: { imageFile: "image104.png", alt: "lithium" },
  "lithium-ion-battery": {
    imageFile: "image105.png",
    alt: "lithium-ion-battery",
  },
  livermorium: { imageFile: "image106.png", alt: "livermorium" },
  lutetium: { imageFile: "image107.png", alt: "lutetium" },
  magazine: { imageFile: "image108.png", alt: "magazine" },
  magnesium: { imageFile: "image109.png", alt: "magnesium" },
  "makeup-brush": { imageFile: "image110.png", alt: "makeup-brush" },
  manganese: { imageFile: "image111.png", alt: "manganese" },
  meitnerium: { imageFile: "image112.png", alt: "meitnerium" },
  mendelevium: { imageFile: "image113.png", alt: "mendelevium" },
  mercury: { imageFile: "image114.png", alt: "mercury" },
  "mixed-fabric-scraps": {
    imageFile: "image115.png",
    alt: "mixed-fabric-scraps",
  },
  "mixed-plastic-packaging": {
    imageFile: "image116.png",
    alt: "mixed-plastic-packaging",
  },
  "mixed-scrap-metal": { imageFile: "image117.png", alt: "mixed-scrap-metal" },
  molybdenum: { imageFile: "image118.png", alt: "molybdenum" },
  moscovium: { imageFile: "image119.png", alt: "moscovium" },
  neodymium: { imageFile: "image120.png", alt: "neodymium" },
  neon: { imageFile: "image121.png", alt: "neon" },
  neptunium: { imageFile: "image122.png", alt: "neptunium" },
  newspaper: { imageFile: "image123.png", alt: "newspaper" },
  nickel: { imageFile: "image124.png", alt: "nickel" },
  nihonium: { imageFile: "image125.png", alt: "nihonium" },
  niobium: { imageFile: "image126.png", alt: "niobium" },
  nitrogen: { imageFile: "image127.png", alt: "nitrogen" },
  nobelium: { imageFile: "image128.png", alt: "nobelium" },
  "nylon-fabric": { imageFile: "image129.png", alt: "nylon-fabric" },
  obsidian: { imageFile: "image130.png", alt: "obsidian" },
  "office-paper": { imageFile: "image131.png", alt: "office-paper" },
  oganesson: { imageFile: "image132.png", alt: "oganesson" },
  osmium: { imageFile: "image133.png", alt: "osmium" },
  oxygen: { imageFile: "image134.png", alt: "oxygen" },
  palladium: { imageFile: "image135.png", alt: "palladium" },
  paper: { imageFile: "image136.png", alt: "paper" },
  // paper: { imageFile: "image137.png", alt: "paper" },
  "paper-towel": { imageFile: "image137.png", alt: "paper-towel" },
  "paper-towel-rolls": { imageFile: "image138.png", alt: "paper-towel-rolls" },
  "paraffin-wax": { imageFile: "image139.png", alt: "paraffin-wax" },
  pencil: { imageFile: "image140.png", alt: "pencil" },
  "PET-plastic": { imageFile: "image141.png", alt: "PET-plastic" },
  "PET-plastic-bottle": {
    imageFile: "image142.png",
    alt: "PET-plastic-bottle",
  },
  phosphorus: { imageFile: "image143.png", alt: "phosphorus" },
  "pizza-box": { imageFile: "image144.png", alt: "pizza-box" },
  "plastic-bag": { imageFile: "image145.png", alt: "plastic-bag" },
  "plastic-milk-container": {
    imageFile: "image146.png",
    alt: "plastic-milk-container",
  },
  platinum: { imageFile: "image147.png", alt: "platinum" },
  plutonium: { imageFile: "image148.png", alt: "plutonium" },
  polonium: { imageFile: "image149.png", alt: "polonium" },
  "polyester-clothing": {
    imageFile: "image150.png",
    alt: "polyester-clothing",
  },
  "polyethylene-(PE)": { imageFile: "image151.png", alt: "polyethylene-(PE)" },
  "polypropylene-(PP)": {
    imageFile: "image152.png",
    alt: "polypropylene-(PP)",
  },
  "polypropylene-container": {
    imageFile: "image153.png",
    alt: "polypropylene-container",
  },
  polystyrene: { imageFile: "image154.png", alt: "polystyrene" },
  "polystyrene-foam-cup": {
    imageFile: "image155.png",
    alt: "polystyrene-foam-cup",
  },
  "polyurethane-pu": { imageFile: "image156.png", alt: "polyurethane (PU)" },
  potassium: { imageFile: "image157.png", alt: "potassium" },
  praseodymium: { imageFile: "image158.png", alt: "praseodymium" },
  promethium: { imageFile: "image159.png", alt: "promethium" },
  protactinium: { imageFile: "image160.png", alt: "protactinium" },
  "pvc-pipe": { imageFile: "image161.png", alt: "pvc-pipe" },
  radium: { imageFile: "image162.png", alt: "radium" },
  radon: { imageFile: "image163.png", alt: "radon" },
  rhenium: { imageFile: "image164.png", alt: "rhenium" },
  rhodium: { imageFile: "image165.png", alt: "rhodium" },
  roentgenium: { imageFile: "image166.png", alt: "roentgenium" },
  rubidium: { imageFile: "image167.png", alt: "rubidium" },
  ruthenium: { imageFile: "image168.png", alt: "ruthenium" },
  rutherfordium: { imageFile: "image169.png", alt: "rutherfordium" },
  samarium: { imageFile: "image170.png", alt: "samarium" },
  scandium: { imageFile: "image171.png", alt: "scandium" },
  seaborgium: { imageFile: "image172.png", alt: "seaborgium" },
  selenium: { imageFile: "image173.png", alt: "selenium" },
  silicon: { imageFile: "image174.png", alt: "silicon" },
  "silicon-bakeware": { imageFile: "image175.png", alt: "silicon-bakeware" },
  silver: { imageFile: "image176.png", alt: "silver" },
  smartphone: { imageFile: "image177.png", alt: "smartphone" },
  sodium: { imageFile: "image178.png", alt: "sodium" },
  speakers: { imageFile: "image179.png", alt: "speakers" },
  "steel-food-can": { imageFile: "image180.png", alt: "steel-food-can" },
  strontium: { imageFile: "image181.png", alt: "strontium" },
  sulfur: { imageFile: "image182.png", alt: "sulfur" },
  tantalum: { imageFile: "image183.png", alt: "tantalum" },
  technetium: { imageFile: "image184.png", alt: "technetium" },
  tellurium: { imageFile: "image185.png", alt: "tellurium" },
  tennessine: { imageFile: "image186.png", alt: "tennessine" },
  terbium: { imageFile: "image187.png", alt: "terbium" },
  thallium: { imageFile: "image188.png", alt: "thallium" },
  "synthetic-wigs": { imageFile: "image189.png", alt: "synthetic-wigs" },
  // hydrogels: { imageFile: "image190.png", alt: "hydrogels" },
  thorium: { imageFile: "image191.png", alt: "thorium" },
  thulium: { imageFile: "image192.png", alt: "thulium" },
  tin: { imageFile: "image193.png", alt: "tin" },
  tire: { imageFile: "image194.png", alt: "tire" },
  "tissue-paper": { imageFile: "image195.png", alt: "tissue-paper" },
  titanium: { imageFile: "image196.png", alt: "titanium" },
  "toilet-paper": { imageFile: "image197.png", alt: "toilet-paper" },
  toothbrush: { imageFile: "image198.png", alt: "toothbrush" },
  toothpaste: { imageFile: "image199.png", alt: "toothpaste" },
  tungsten: { imageFile: "image200.png", alt: "tungsten" },
  uranium: { imageFile: "image201.png", alt: "uranium" },
  "used-cooking-oil": { imageFile: "image202.png", alt: "used-cooking-oil" },
  vanadium: { imageFile: "image203.png", alt: "vanadium" },
  "vinyl-flooring": { imageFile: "image204.png", alt: "vinyl-flooring" },
  "wood-chips": { imageFile: "image205.png", alt: "wood-chips" },
  "wood-pallet": { imageFile: "image206.png", alt: "wood-pallet" },
  "wool-sweater": { imageFile: "image207.png", alt: "wool-sweater" },
  xenon: { imageFile: "image208.png", alt: "xenon" },
  "yard-waste": { imageFile: "image209.png", alt: "yard-waste" },
  ytterbium: { imageFile: "image210.png", alt: "ytterbium" },
  yttrium: { imageFile: "image211.png", alt: "yttrium" },
  zinc: { imageFile: "image212.png", alt: "zinc" },
  "zipper-storage-bag": {
    imageFile: "image213.png",
    alt: "zipper-storage-bag",
  },
  zirconium: { imageFile: "image214.png", alt: "zirconium" },
};

export function getMaterialDoodle(
  materialId?: string,
  materialName?: string,
): MaterialDoodle | undefined {
  const nameKey = materialName ? slugifyMaterialName(materialName) : undefined;
  const lookupKey =
    (materialId && MATERIAL_DOODLES[materialId] ? materialId : undefined) ||
    (nameKey && MATERIAL_DOODLES[nameKey] ? nameKey : undefined);
  const entry = !lookupKey ? undefined : MATERIAL_DOODLES[lookupKey];
  if (!entry || !lookupKey) return undefined;

  return {
    materialId: lookupKey,
    ...entry,
    publicUrl: buildMaterialDoodlePublicUrl(entry.imageFile),
  };
}
