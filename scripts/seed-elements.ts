import { projectId, publicAnonKey } from "../src/utils/supabase/info";

/**
 * Seed Periodic Table Elements as Materials
 *
 * Creates a material "hub" entry for each of the 118 elements in the periodic table.
 * Each element gets a clean permalink at /m/<element-name> (e.g. /m/hydrogen).
 *
 * Run with:
 *   WASTEDB_ACCESS_TOKEN=<token> npx tsx scripts/seed-elements.ts
 *
 * Get your access token by signing in to the app and running:
 *   sessionStorage.getItem('wastedb_access_token')
 *
 * Options:
 *   --dry-run   Print elements without making API calls
 *   --from=N    Start from element number N (for resuming after partial run)
 */

const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-17cae920`;

const ACCESS_TOKEN = process.env.WASTEDB_ACCESS_TOKEN;
const DRY_RUN = process.argv.includes("--dry-run");
const FROM_ARG = process.argv.find((a) => a.startsWith("--from="));
const FROM_N = FROM_ARG ? parseInt(FROM_ARG.split("=")[1], 10) : 1;

function looksLikeAuthToken(token: string): boolean {
  const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return jwtPattern.test(token) || uuidPattern.test(token);
}

if (!DRY_RUN && !ACCESS_TOKEN) {
  console.error(
    "Error: WASTEDB_ACCESS_TOKEN environment variable is required.",
  );
  console.error(
    "Get it from the app: sessionStorage.getItem('wastedb_access_token')",
  );
  process.exit(1);
}

if (!DRY_RUN && ACCESS_TOKEN && !looksLikeAuthToken(ACCESS_TOKEN)) {
  console.error("Error: WASTEDB_ACCESS_TOKEN format is invalid.");
  console.error(
    "Expected either a JWT ('xxxxx.yyyyy.zzzzz') or a UUID session token.",
  );
  process.exit(1);
}

// ============================================================
// ELEMENT DATA
// Each entry: [atomicNumber, symbol, name, description]
// ============================================================

const ELEMENTS: [number, string, string, string][] = [
  [
    1,
    "H",
    "Hydrogen",
    "The lightest and most abundant element in the universe; a colorless, odorless, highly flammable gas used in fuel cells, ammonia production, and as a potential clean energy carrier.",
  ],
  [
    2,
    "He",
    "Helium",
    "A colorless, odorless, non-reactive noble gas; the second most abundant element in the universe; used in cryogenics, MRI cooling, pressurizing rockets, and balloons.",
  ],
  [
    3,
    "Li",
    "Lithium",
    "A soft, silvery-white alkali metal; the lightest solid element; a critical material in lithium-ion batteries for electric vehicles and portable electronics.",
  ],
  [
    4,
    "Be",
    "Beryllium",
    "A lightweight, rigid, gray alkaline earth metal; used in aerospace structures, nuclear reactor components, and precision instruments due to its stiffness and low density.",
  ],
  [
    5,
    "B",
    "Boron",
    "A metalloid with semiconductor properties; used in borosilicate glass, fiberglass insulation, nuclear reactor control rods, and agricultural micronutrient applications.",
  ],
  [
    6,
    "C",
    "Carbon",
    "A nonmetal foundational to all known life; forms diamond, graphite, graphene, and fullerenes; central to organic chemistry, fossil fuels, carbon capture, and advanced materials.",
  ],
  [
    7,
    "N",
    "Nitrogen",
    "A colorless, odorless diatomic gas comprising 78% of Earth's atmosphere; indispensable for fertilizer production (Haber-Bosch), explosives, and cryogenic applications.",
  ],
  [
    8,
    "O",
    "Oxygen",
    "A highly reactive nonmetal essential to aerobic respiration; used in steelmaking, medical breathing equipment, wastewater treatment, and rocket propulsion.",
  ],
  [
    9,
    "F",
    "Fluorine",
    "The most electronegative and reactive element; used in water fluoridation, PTFE (Teflon) non-stick coatings, refrigerants, and pharmaceutical synthesis.",
  ],
  [
    10,
    "Ne",
    "Neon",
    "A colorless, odorless noble gas; famously used in neon signs and display lighting; also used in high-voltage indicators and cryogenic refrigeration.",
  ],
  [
    11,
    "Na",
    "Sodium",
    "A soft, highly reactive silver alkali metal; essential for nerve function and fluid balance; used as table salt (NaCl), in street lamps, and industrial chemical processes.",
  ],
  [
    12,
    "Mg",
    "Magnesium",
    "A shiny, gray alkaline earth metal; the ninth most abundant element in the universe; a lightweight structural material in automotive and aerospace alloys, and essential for plant chlorophyll.",
  ],
  [
    13,
    "Al",
    "Aluminum",
    "A silvery-white, lightweight, corrosion-resistant metal; the most abundant metal in Earth's crust; one of the most widely recycled materials globally with near-infinite recyclability.",
  ],
  [
    14,
    "Si",
    "Silicon",
    "A hard, brittle gray metalloid; the second most abundant element in Earth's crust; the foundation of semiconductor technology, solar panels, and silicone materials.",
  ],
  [
    15,
    "P",
    "Phosphorus",
    "A highly reactive nonmetal essential for DNA, ATP energy metabolism, and cell membranes; a critical finite resource mined for agricultural fertilizers.",
  ],
  [
    16,
    "S",
    "Sulfur",
    "A bright yellow nonmetal; used in rubber vulcanization, sulfuric acid production (the most-produced industrial chemical), fungicides, and pharmaceuticals.",
  ],
  [
    17,
    "Cl",
    "Chlorine",
    "A yellow-green toxic halogen gas; used in drinking water disinfection, PVC plastic production, bleach manufacturing, and pharmaceutical synthesis.",
  ],
  [
    18,
    "Ar",
    "Argon",
    "A colorless, odorless, inert noble gas; the third most abundant gas in Earth's atmosphere; widely used as an inert shielding gas in welding and semiconductor manufacturing.",
  ],
  [
    19,
    "K",
    "Potassium",
    "A soft, silvery-white alkali metal; the seventh most abundant element in Earth's crust; an essential biological electrolyte and the dominant nutrient in agricultural fertilizers (potash).",
  ],
  [
    20,
    "Ca",
    "Calcium",
    "A soft, gray alkaline earth metal; the fifth most abundant element in Earth's crust; structural component of bones, teeth, concrete (calcium silicate), and limestone.",
  ],
  [
    21,
    "Sc",
    "Scandium",
    "A rare, silvery-white transition metal; used in scandium-aluminum alloys for aerospace and sporting goods, and as a phosphor in high-intensity stadium lights.",
  ],
  [
    22,
    "Ti",
    "Titanium",
    "A strong, lightweight, corrosion-resistant transition metal; used in aerospace structures, medical implants, marine hardware, and as a white pigment (TiO₂).",
  ],
  [
    23,
    "V",
    "Vanadium",
    "A hard, silvery-gray transition metal; used as a hardening agent in high-strength steel alloys, in vanadium redox flow batteries for grid-scale energy storage, and as a catalyst.",
  ],
  [
    24,
    "Cr",
    "Chromium",
    "A hard, lustrous, corrosion-resistant transition metal; essential for stainless steel production, chrome plating, and manufacturing refractory bricks for furnaces.",
  ],
  [
    25,
    "Mn",
    "Manganese",
    "A gray-white transition metal; essential in steelmaking to improve hardness and toughness; used in dry-cell batteries, aluminum alloys, and as a plant micronutrient.",
  ],
  [
    26,
    "Fe",
    "Iron",
    "A lustrous, ductile, magnetic silvery-gray metal; the most abundant element by mass in Earth; by far the most widely used structural metal on Earth, primarily as steel.",
  ],
  [
    27,
    "Co",
    "Cobalt",
    "A hard, lustrous, silver-gray transition metal; a critical material in lithium-ion battery cathodes (NMC, NCA), jet engine superalloys, and blue ceramic pigments.",
  ],
  [
    28,
    "Ni",
    "Nickel",
    "A silvery-white, lustrous, corrosion-resistant transition metal; used in stainless steel, rechargeable batteries (NiMH, Li-ion NCA), superalloys, and electroplating.",
  ],
  [
    29,
    "Cu",
    "Copper",
    "A reddish-orange, malleable, highly conductive metal; the primary material for electrical wiring, motors, plumbing, and a key component in renewable energy infrastructure.",
  ],
  [
    30,
    "Zn",
    "Zinc",
    "A bluish-white, lustrous metal; used for galvanizing steel to prevent corrosion, die-cast automotive parts, brass alloys, and as an essential human nutritional mineral.",
  ],
  [
    31,
    "Ga",
    "Gallium",
    "A soft, silvery metal that liquefies slightly above room temperature; a critical material in gallium arsenide and gallium nitride semiconductors for LEDs, solar cells, and 5G chips.",
  ],
  [
    32,
    "Ge",
    "Germanium",
    "A lustrous, hard, grayish-white metalloid; used in fiber optic cables, infrared optical equipment, solar cell substrates, and as a semiconductor material.",
  ],
  [
    33,
    "As",
    "Arsenic",
    "A gray metalloid and highly toxic element; used in gallium arsenide semiconductors, wood preservatives (no longer in residential use), and historically in pesticides.",
  ],
  [
    34,
    "Se",
    "Selenium",
    "A nonmetal with photovoltaic and semiconducting properties; used in cadmium selenide quantum dots, solar panels, glass decolorizing, and as an essential dietary trace mineral.",
  ],
  [
    35,
    "Br",
    "Bromine",
    "A reddish-brown volatile liquid halogen; one of only two elements liquid at room temperature; used in flame retardants, water treatment, drilling fluids, and pharmaceuticals.",
  ],
  [
    36,
    "Kr",
    "Krypton",
    "A colorless, odorless noble gas; used in high-performance lighting (krypton flash lamps), energy-efficient windows (gas fill), and formerly as a reference standard for the meter.",
  ],
  [
    37,
    "Rb",
    "Rubidium",
    "A soft, silvery-white alkali metal; used in GPS and telecommunications atomic clocks, photoelectric cells for motion sensors, and specialty glass manufacturing.",
  ],
  [
    38,
    "Sr",
    "Strontium",
    "A soft, silver-yellow alkaline earth metal; used to produce red flames in fireworks and flares, in strontium titanate gemstones, and in radioactive strontium-90 for medical imaging.",
  ],
  [
    39,
    "Y",
    "Yttrium",
    "A silvery-metallic rare earth transition metal; a critical material in phosphors for LED backlights and displays, yttrium-aluminum-garnet (YAG) lasers, and high-temperature superconductors.",
  ],
  [
    40,
    "Zr",
    "Zirconium",
    "A lustrous, gray-white, highly corrosion-resistant transition metal; used in nuclear reactor fuel rod cladding, medical implants, ceramic knives, and cubic zirconia gemstones.",
  ],
  [
    41,
    "Nb",
    "Niobium",
    "A soft, gray, ductile transition metal; used in high-strength low-alloy (HSLA) pipeline and structural steels, superconducting magnets (MRI, particle accelerators), and aerospace alloys.",
  ],
  [
    42,
    "Mo",
    "Molybdenum",
    "A silvery-gray transition metal with one of the highest melting points; used as a hardening and corrosion-resistant additive in steel alloys, and in high-temperature industrial furnaces.",
  ],
  [
    43,
    "Tc",
    "Technetium",
    "The lightest radioactive element and the first artificially produced element; no stable isotopes exist in nature; metastable technetium-99m is widely used in nuclear medicine diagnostic imaging.",
  ],
  [
    44,
    "Ru",
    "Ruthenium",
    "A rare, hard, silvery-white platinum-group metal; used as a catalyst in chemical processes, in ruthenium-enhanced alloys, electrical contacts, and solar energy research.",
  ],
  [
    45,
    "Rh",
    "Rhodium",
    "An extremely rare, silvery-white, hard platinum-group metal; one of the most valuable metals; primarily used in three-way catalytic converters to reduce vehicle emissions.",
  ],
  [
    46,
    "Pd",
    "Palladium",
    "A rare, lustrous, silvery-white platinum-group metal; the primary catalyst in automotive catalytic converters; also used in hydrogen purification membranes and fuel cells.",
  ],
  [
    47,
    "Ag",
    "Silver",
    "A soft, lustrous, precious metal with the highest electrical and thermal conductivity of any element; used in electronics, photovoltaics, antimicrobial coatings, and jewelry.",
  ],
  [
    48,
    "Cd",
    "Cadmium",
    "A soft, bluish-white transition metal; a toxic heavy metal; used historically in nickel-cadmium batteries, yellow/orange pigments, and electroplating finishes (largely being phased out).",
  ],
  [
    49,
    "In",
    "Indium",
    "A soft, silvery-white post-transition metal; primarily used as indium tin oxide (ITO) in touchscreens and flat-panel displays, as well as in soldering alloys and semiconductors.",
  ],
  [
    50,
    "Sn",
    "Tin",
    "A silvery-white, malleable, ductile post-transition metal; used in lead-free solder for electronics, tin-plated steel (tinplate) for food cans, and bronze alloys.",
  ],
  [
    51,
    "Sb",
    "Antimony",
    "A lustrous gray metalloid; used as a flame retardant synergist in plastics and textiles, in lead-acid batteries as a hardener, and in some semiconductor devices.",
  ],
  [
    52,
    "Te",
    "Tellurium",
    "A brittle, silver-white metalloid; a critical material in cadmium telluride (CdTe) thin-film solar panels, thermoelectric devices, and as an additive in lead and steel alloys.",
  ],
  [
    53,
    "I",
    "Iodine",
    "A dark gray/violet nonmetal; an essential micronutrient for thyroid hormone synthesis; used in medical disinfectants, iodized salt, X-ray contrast media, and LCD polarizing filters.",
  ],
  [
    54,
    "Xe",
    "Xenon",
    "A colorless, dense, heavy noble gas; used in high-intensity HID automotive headlamps, flash lamps for photography, xenon ion thrusters for spacecraft, and medical anesthesia.",
  ],
  [
    55,
    "Cs",
    "Cesium",
    "A soft, gold-colored alkali metal; the most electropositive stable element; cesium atomic clocks define the SI second and are the basis of GPS timing systems worldwide.",
  ],
  [
    56,
    "Ba",
    "Barium",
    "A soft, silvery alkaline earth metal; used in oil-well drilling muds (barite), medical barium sulfate contrast agents for GI imaging, and to produce green flames in fireworks.",
  ],
  [
    57,
    "La",
    "Lanthanum",
    "A soft, ductile, silvery-white rare earth element; used in high-refractive-index camera and telescope lenses, nickel-metal hydride battery anodes, and fluid cracking catalysts.",
  ],
  [
    58,
    "Ce",
    "Cerium",
    "The most abundant rare earth element; used in catalytic converters, glass polishing powders, ultraviolet-absorbing glass coatings, and as a flint material in cigarette lighters.",
  ],
  [
    59,
    "Pr",
    "Praseodymium",
    "A soft, silvery, malleable rare earth metal; used in neodymium-praseodymium-iron-boron permanent magnets, aircraft turbine engine alloys, and yellow-green glass and enamel coloring.",
  ],
  [
    60,
    "Nd",
    "Neodymium",
    "A rare earth metal; the key component of neodymium-iron-boron (NdFeB) permanent magnets—the strongest type made—used in EV motors, wind turbines, hard drives, and headphones.",
  ],
  [
    61,
    "Pm",
    "Promethium",
    "A radioactive rare earth element with no stable isotopes; occurs only in trace amounts in uranium ores; historically used in luminous watch dials and as a thickness gauge radiation source.",
  ],
  [
    62,
    "Sm",
    "Samarium",
    "A moderately hard, silvery rare earth metal; used in samarium-cobalt permanent magnets (high-temperature stability), neutron-absorbing nuclear reactor control rods, and targeted cancer radiotherapy.",
  ],
  [
    63,
    "Eu",
    "Europium",
    "A highly reactive rare earth element; known for strong red and blue photoluminescence; used as a phosphor in LED lighting, television screens, and as a security ink in Euro banknotes.",
  ],
  [
    64,
    "Gd",
    "Gadolinium",
    "A silvery-white, ferromagnetic rare earth metal; gadolinium chelates are the most common MRI contrast agents; also used in nuclear reactor control rods and neutron capture therapy.",
  ],
  [
    65,
    "Tb",
    "Terbium",
    "A silvery-white, soft rare earth metal; used in terfenol-D magnetostrictive alloys for sonar and actuators, green phosphors in display screens, and solid-state devices.",
  ],
  [
    66,
    "Dy",
    "Dysprosium",
    "A rare earth element; a critical additive in neodymium magnets to maintain performance at high temperatures in EV motors; also used in nuclear reactor control rods.",
  ],
  [
    67,
    "Ho",
    "Holmium",
    "A rare earth element with the highest magnetic moment of any naturally occurring element; used in ultra-strong magnets, as a neutron absorber in nuclear reactors, and in solid-state lasers.",
  ],
  [
    68,
    "Er",
    "Erbium",
    "A silvery-white rare earth element; used as a dopant in erbium-doped fiber amplifiers (EDFAs) fundamental to long-distance fiber optic telecommunications, and in surgical erbium:YAG lasers.",
  ],
  [
    69,
    "Tm",
    "Thulium",
    "The least abundant naturally occurring rare earth element; used in portable X-ray devices powered by radioactive thulium-170, and in thulium fiber and crystal lasers for surgery.",
  ],
  [
    70,
    "Yb",
    "Ytterbium",
    "A rare earth metal; used as a dopant in ytterbium fiber lasers (high efficiency), in optical atomic clocks with extreme precision, and as a radiation source for portable X-ray devices.",
  ],
  [
    71,
    "Lu",
    "Lutetium",
    "The heaviest and hardest rare earth element; used in lutetium oxyorthosilicate (LSO) scintillators for PET scanners, and in targeted alpha and beta radionuclide therapy for cancer.",
  ],
  [
    72,
    "Hf",
    "Hafnium",
    "A lustrous, silvery, ductile transition metal chemically similar to zirconium; used in nuclear reactor control rods, high-temperature nickel-based superalloys for jet engines, and as a high-k dielectric in CMOS chip gates.",
  ],
  [
    73,
    "Ta",
    "Tantalum",
    "A rare, hard, blue-gray transition metal with extreme corrosion resistance; a critical material in tantalum capacitors found in virtually all modern electronics, and in orthopedic and dental implants.",
  ],
  [
    74,
    "W",
    "Tungsten",
    "A gray-white transition metal with the highest melting point (3,422 °C) of all elements; used in incandescent light bulb filaments, tungsten carbide cutting tools, X-ray tube targets, and armor-piercing ammunition.",
  ],
  [
    75,
    "Re",
    "Rhenium",
    "One of the rarest elements in Earth's crust with one of the highest melting points; used in rhenium-platinum bimetallic catalysts for petroleum refining and in single-crystal nickel-rhenium superalloy turbine blades.",
  ],
  [
    76,
    "Os",
    "Osmium",
    "The densest naturally occurring element; a hard, brittle, blue-gray platinum-group metal; used as a hardening agent in osmium-iridium alloys for fountain pen nibs, electrical contacts, and as a fixative in electron microscopy.",
  ],
  [
    77,
    "Ir",
    "Iridium",
    "The second densest and most corrosion-resistant element; a hard, brittle, silvery platinum-group metal; used in spark plug electrodes (extreme durability), crucibles for high-temperature crystal growth, and the kilogram prototype alloy.",
  ],
  [
    78,
    "Pt",
    "Platinum",
    "A dense, ductile, highly corrosion-resistant precious platinum-group metal; the primary catalyst in automotive and industrial catalytic converters, used in fuel cells, anti-cancer chemotherapy drugs, and fine jewelry.",
  ],
  [
    79,
    "Au",
    "Gold",
    "A dense, soft, brilliant, inert precious metal; prized throughout human history as a monetary standard and for jewelry; a critical material in electronics for corrosion-free contacts, and in medical diagnostics (gold nanoparticles).",
  ],
  [
    80,
    "Hg",
    "Mercury",
    "The only pure metallic element that is liquid at standard conditions; a toxic heavy metal; used in fluorescent lamps, chlor-alkali electrolysis, thermometers, and dental amalgam fillings (many uses being phased out due to toxicity).",
  ],
  [
    81,
    "Tl",
    "Thallium",
    "A soft, malleable, grayish post-transition metal; highly toxic; used in thallium sulfide detectors for infrared light, specialty low-melting-point glass, and thallium-201 in nuclear cardiac stress testing.",
  ],
  [
    82,
    "Pb",
    "Lead",
    "A heavy, malleable, toxic metal with a very low melting point; the dominant material in lead-acid batteries (still the most recycled material by mass globally), radiation shielding for X-rays, and as a shotgun shot and fishing weights.",
  ],
  [
    83,
    "Bi",
    "Bismuth",
    "A brittle, silvery-pink post-transition metal with very low toxicity compared to neighboring heavy metals; used in bismuth subsalicylate antacids, lead-free solders, low-melting-point alloys, and ceramic pigments.",
  ],
  [
    84,
    "Po",
    "Polonium",
    "An extremely rare, highly radioactive metalloid; discovered by Marie Curie; used as an alpha particle source in antistatic devices and neutron trigger initiators; all isotopes are radioactive.",
  ],
  [
    85,
    "At",
    "Astatine",
    "The rarest naturally occurring element on Earth at any given time; a radioactive halogen; studied for use in targeted alpha-particle radiotherapy (astatine-211) for cancer treatment.",
  ],
  [
    86,
    "Rn",
    "Radon",
    "A colorless, odorless, naturally occurring radioactive noble gas; a decay product of radium and uranium; the second leading cause of lung cancer after smoking due to indoor accumulation; historically used in some cancer radiation therapy.",
  ],
  [
    87,
    "Fr",
    "Francium",
    "The second rarest naturally occurring element; an extremely short-lived alkali metal; no practical applications exist outside of atomic physics research into atomic structure.",
  ],
  [
    88,
    "Ra",
    "Radium",
    "A highly radioactive alkaline earth metal; discovered by Marie and Pierre Curie; historically used in luminescent radium dial paint and medical radiotherapy; now largely replaced by safer alternatives.",
  ],
  [
    89,
    "Ac",
    "Actinium",
    "A soft, silvery-white radioactive rare earth metal; three times more radioactive than radium; actinium-225 is a promising isotope for targeted alpha therapy (TAT) in cancer treatment.",
  ],
  [
    90,
    "Th",
    "Thorium",
    "A weakly radioactive, dense, silvery actinide metal; more abundant than uranium; investigated as a potential thorium molten salt nuclear reactor fuel with improved safety and waste profiles compared to uranium.",
  ],
  [
    91,
    "Pa",
    "Protactinium",
    "A rare, radioactive, dense, silvery-gray actinide; found in trace amounts in uranium ores; no significant commercial applications; primarily of interest to nuclear scientists and historians of element discovery.",
  ],
  [
    92,
    "U",
    "Uranium",
    "A dense, weakly radioactive silvery-gray actinide metal; the primary fuel for nuclear fission power plants generating ~10% of global electricity; also historically used in dense metal penetrators and yellow uranium glass pigments.",
  ],
  [
    93,
    "Np",
    "Neptunium",
    "The first transuranic element; a radioactive, silvery actinide; found in trace amounts in uranium ores as a fission product; used in neutron detection equipment and as a precursor to producing plutonium-238 for spacecraft RTGs.",
  ],
  [
    94,
    "Pu",
    "Plutonium",
    "A dense, radioactive, silvery actinide; the most widely used fuel in nuclear weapons; plutonium-238 is used as a long-lasting heat source in radioisotope thermoelectric generators (RTGs) powering deep space probes like Voyager.",
  ],
  [
    95,
    "Am",
    "Americium",
    "A synthetic, radioactive, silvery actinide; americium-241 is used in virtually all household ionization-type smoke detectors as an alpha radiation source, and in some industrial gauges.",
  ],
  [
    96,
    "Cm",
    "Curium",
    "A synthetic, intensely radioactive silvery actinide; named after Marie and Pierre Curie; curium-244 has been used as an alpha-particle power source in spacecraft RTGs and in the Alpha Particle X-Ray Spectrometer on Mars rovers.",
  ],
  [
    97,
    "Bk",
    "Berkelium",
    "A synthetic radioactive actinide; named after Berkeley, California; produced in microgram quantities in nuclear reactors; berkelium-249 is used as a target to synthesize heavier transactinide elements.",
  ],
  [
    98,
    "Cf",
    "Californium",
    "A synthetic, radioactive actinide; californium-252 is a strong spontaneous fission neutron source used to start nuclear reactors, in neutron activation analysis for mineral prospecting, and in treating cervical cancer with brachytherapy.",
  ],
  [
    99,
    "Es",
    "Einsteinium",
    "A synthetic, radioactive actinide; named after Albert Einstein; first discovered in the fallout of the 1952 Ivy Mike thermonuclear test; produced in picogram quantities; used primarily in scientific research on transuranic elements.",
  ],
  [
    100,
    "Fm",
    "Fermium",
    "A synthetic, radioactive actinide; named after Enrico Fermi; also first observed in Ivy Mike fallout; only a few micrograms have ever been produced; no practical applications outside of nuclear research.",
  ],
  [
    101,
    "Md",
    "Mendelevium",
    "A synthetic, radioactive actinide; named after Dmitri Mendeleev, creator of the periodic table; produced in quantities of only a few atoms at a time; studied to understand the actinide series chemistry.",
  ],
  [
    102,
    "No",
    "Nobelium",
    "A synthetic, radioactive actinide; named after Alfred Nobel; produced in very small quantities using heavy-ion bombardment; no practical applications; studied for nuclear structure and chemical properties.",
  ],
  [
    103,
    "Lr",
    "Lawrencium",
    "A synthetic, radioactive actinide; named after Ernest Lawrence, inventor of the cyclotron; the last member of the actinide series; produced in atom-at-a-time quantities; studied for relativistic effects on chemical properties.",
  ],
  [
    104,
    "Rf",
    "Rutherfordium",
    "A synthetic, highly radioactive transactinide element; named after Ernest Rutherford; the first transactinide element; produced in quantities of a few atoms; studied for chemical properties consistent with group 4.",
  ],
  [
    105,
    "Db",
    "Dubnium",
    "A synthetic, radioactive transactinide element; named after Dubna, Russia (JINR); only a few hundred atoms have ever been produced; studied to test relativistic quantum chemistry predictions for group 5 elements.",
  ],
  [
    106,
    "Sg",
    "Seaborgium",
    "A synthetic, radioactive transactinide element; named after Glenn T. Seaborg, who co-discovered ten elements; produced in minute quantities; chemical experiments confirm group 6 behavior similar to tungsten and molybdenum.",
  ],
  [
    107,
    "Bh",
    "Bohrium",
    "A synthetic, radioactive transactinide element; named after Niels Bohr; produced in quantities of only a few atoms at a time; half-lives of the most stable isotopes are on the order of seconds.",
  ],
  [
    108,
    "Hs",
    "Hassium",
    "A synthetic, radioactive transactinide element; named after the German state of Hesse; produced in very small quantities; chemical studies show it behaves as a heavier homologue of osmium in group 8.",
  ],
  [
    109,
    "Mt",
    "Meitnerium",
    "A synthetic, radioactive transactinide element; named after physicist Lise Meitner; only a few atoms have ever been synthesized; no chemical experiments have been performed due to extremely short half-lives.",
  ],
  [
    110,
    "Ds",
    "Darmstadtium",
    "A synthetic, radioactive transactinide element; named after Darmstadt, Germany (GSI); only a few atoms produced to date; predicted to be a group 10 element analogous to platinum; no known uses.",
  ],
  [
    111,
    "Rg",
    "Roentgenium",
    "A synthetic, radioactive transactinide element; named after Wilhelm Röntgen, discoverer of X-rays; extremely unstable with half-lives of microseconds to seconds; no practical applications; studied for relativistic effects.",
  ],
  [
    112,
    "Cn",
    "Copernicium",
    "A synthetic, radioactive transactinide element; named after Nicolaus Copernicus; produced in single-atom quantities; the most volatile metal known; may be a gas at room temperature due to relativistic effects.",
  ],
  [
    113,
    "Nh",
    "Nihonium",
    "A synthetic, radioactive transactinide element; named after Japan (Nihon in Japanese); the first element discovered and synthesized entirely in Asia (RIKEN, Japan); no practical applications.",
  ],
  [
    114,
    "Fl",
    "Flerovium",
    "A synthetic, radioactive transactinide element; named after the Flerov Laboratory of Nuclear Reactions in Dubna; a member of group 14; may exhibit unusual chemical behavior due to strong relativistic effects.",
  ],
  [
    115,
    "Mc",
    "Moscovium",
    "A synthetic, radioactive transactinide element; named after Moscow Oblast, Russia; synthesized at the Joint Institute for Nuclear Research (JINR); decays rapidly through alpha emission; no practical applications.",
  ],
  [
    116,
    "Lv",
    "Livermorium",
    "A synthetic, radioactive transactinide element; named after the Lawrence Livermore National Laboratory; synthesized in collaboration between LLNL and JINR; decays in milliseconds; no known uses outside research.",
  ],
  [
    117,
    "Ts",
    "Tennessine",
    "A synthetic, radioactive transactinide halogen; named after Tennessee, honoring Oak Ridge National Laboratory, Vanderbilt University, and the University of Tennessee; extremely unstable with half-lives under milliseconds.",
  ],
  [
    118,
    "Og",
    "Oganesson",
    "The heaviest known element and the last on the periodic table; a synthetic transactinide noble gas; named after nuclear physicist Yuri Oganessian; synthesized in 2002 with only 5 atoms ever confirmed; predicted to be solid at room temperature due to relativistic effects.",
  ],
];

// ============================================================
// HELPERS
// ============================================================

function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

async function createMaterial(material: object): Promise<void> {
  const res = await fetch(`${BASE_URL}/materials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
      "X-Session-Token": ACCESS_TOKEN!,
    },
    body: JSON.stringify(material),
  });

  if (!res.ok) {
    const body = await res.text();
    const error = new Error(`HTTP ${res.status}: ${body}`) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const elements = ELEMENTS.filter(([n]) => n >= FROM_N);

  console.log(
    `\nSeeding ${elements.length} periodic table elements as materials`,
  );
  if (DRY_RUN) console.log("(DRY RUN — no API calls will be made)\n");
  if (FROM_N > 1) console.log(`(Starting from element ${FROM_N})\n`);

  let success = 0;
  let failed = 0;

  for (const [atomicNumber, symbol, name, description] of elements) {
    const id = `element-${symbol.toLowerCase()}`;
    const material = {
      id,
      name,
      category: "Elements",
      description,
      compostability: 0,
      recyclability: 0,
      reusability: 0,
      // Store element-specific metadata in the description context
      // for display on the hub page. Full scientific data filled in by curators.
      whitepaper_version: "elements-v1",
    };

    const permalink = `/m/${slugify(name)}`;

    if (DRY_RUN) {
      console.log(
        `  [${String(atomicNumber).padStart(3)}] ${symbol.padEnd(3)} ${name.padEnd(16)} → ${permalink}`,
      );
      success++;
      continue;
    }

    try {
      await createMaterial(material);
      console.log(
        `  ✓ [${String(atomicNumber).padStart(3)}] ${symbol.padEnd(3)} ${name} → ${permalink}`,
      );
      success++;
    } catch (err) {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as { status?: number }).status
          : undefined;

      console.error(
        `  ✗ [${String(atomicNumber).padStart(3)}] ${symbol.padEnd(3)} ${name}: ${err}`,
      );
      failed++;

      if (status === 401 || status === 403) {
        console.error(
          "\nAuthentication failed. Stop here and refresh your token by signing in again.",
        );
        console.error(
          "Then run the script again with the new sessionStorage wastedb_access_token value.",
        );
        break;
      }
    }

    // Small delay to avoid rate-limiting
    await new Promise((r) => setTimeout(r, 150));
  }

  console.log(`\n${"─".repeat(50)}`);
  console.log(`  Elements seeded: ${success}`);
  if (failed > 0)
    console.log(
      `  Failed:          ${failed} (re-run with --from=N to resume)`,
    );
  console.log(`${"─".repeat(50)}\n`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
