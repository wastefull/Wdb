#!/usr/bin/env python3
"""
Elicit Prompt Generator for WasteDB MIU Research

Generates research queries for Elicit based on material, dimension, and parameter.
"""

import sys

# Parameter definitions
PARAMETERS = {
    "CR": {
        "Y": {
            "name": "Yield",
            "description": "Material recovery rate",
            "prompt_template": "What is the mechanical recycling recovery rate or yield for {material}?"
        },
        "D": {
            "name": "Degradability",
            "description": "Quality retention",
            "prompt_template": "What is the quality retention or degradation rate of {material} during recycling?"
        },
        "C": {
            "name": "Contamination",
            "description": "Contamination tolerance",
            "prompt_template": "What is the contamination tolerance or purity requirement for {material} recycling?"
        },
        "U": {
            "name": "Cleanliness",
            "description": "Input cleanliness",
            "prompt_template": "What is the required cleanliness or preprocessing for {material} recycling?"
        }
    },
    "CC": {
        "B": {
            "name": "Biodegradation",
            "description": "Biodegradation rate",
            "prompt_template": "What is the biodegradation or disintegration rate of {material} under composting conditions?"
        },
        "N": {
            "name": "Nutrient Balance",
            "description": "C:N:P ratio suitability",
            "prompt_template": "What is the carbon to nitrogen ratio or nutrient balance of {material} for composting?"
        },
        "T": {
            "name": "Toxicity",
            "description": "Toxicity/residue index",
            "prompt_template": "What are the toxicity levels or residue concerns for {material} in composting?"
        },
        "H": {
            "name": "Habitat Adaptability",
            "description": "Composting system compatibility",
            "prompt_template": "What percentage of composting systems can process {material} effectively?"
        }
    },
    "RU": {
        "L": {
            "name": "Lifetime",
            "description": "Functional cycles",
            "prompt_template": "What is the expected lifespan or number of use cycles for {material} products?"
        },
        "R": {
            "name": "Repairability",
            "description": "Ease of disassembly/repair",
            "prompt_template": "What is the repairability or ease of disassembly for {material} products?"
        },
        "U": {
            "name": "Upgradability",
            "description": "Ease of adaptation/repurposing",
            "prompt_template": "What is the upgradability or adaptability of {material} for repurposing?"
        },
        "C": {
            "name": "Contamination",
            "description": "Functional loss probability",
            "prompt_template": "What is the functional degradation or contamination risk for reused {material}?"
        }
    }
}

DIMENSIONS = {
    "CR": "Recyclability",
    "CC": "Compostability",
    "RU": "Reusability"
}


def get_material_name():
    """Prompt user for material name."""
    print("\n" + "="*60)
    print("  WasteDB Elicit Prompt Generator")
    print("="*60)
    print()
    
    material = input("Enter material name (e.g., PET, HDPE, Cardboard): ").strip()
    
    if not material:
        print("Error: Material name cannot be empty")
        sys.exit(1)
    
    return material


def select_dimension():
    """Prompt user to select dimension."""
    print("\n" + "-"*60)
    print("Select Dimension:")
    print("-"*60)
    
    for code, name in DIMENSIONS.items():
        print(f"  [{code}] {name}")
    
    print()
    dimension = input("Enter dimension code (CR/CC/RU): ").strip().upper()
    
    if dimension not in DIMENSIONS:
        print(f"Error: Invalid dimension '{dimension}'. Must be CR, CC, or RU")
        sys.exit(1)
    
    return dimension


def select_parameter(dimension):
    """Prompt user to select parameter for the chosen dimension."""
    params = PARAMETERS[dimension]
    
    print("\n" + "-"*60)
    print(f"Available Parameters for {DIMENSIONS[dimension]}:")
    print("-"*60)
    
    for code, info in params.items():
        print(f"  [{code}] {info['name']:<20} - {info['description']}")
    
    print()
    param = input("Enter parameter code: ").strip().upper()
    
    if param not in params:
        valid_params = ", ".join(params.keys())
        print(f"Error: Invalid parameter '{param}'. Must be one of: {valid_params}")
        sys.exit(1)
    
    return param


def generate_prompt(material, dimension, parameter):
    """Generate Elicit search prompt."""
    param_info = PARAMETERS[dimension][parameter]
    prompt = param_info["prompt_template"].format(material=material)
    
    return prompt


def display_result(material, dimension, parameter, prompt):
    """Display the generated prompt with context."""
    param_info = PARAMETERS[dimension][parameter]
    
    print("\n" + "="*60)
    print("  Generated Elicit Prompt")
    print("="*60)
    print()
    print(f"Material:   {material}")
    print(f"Dimension:  {DIMENSIONS[dimension]} ({dimension})")
    print(f"Parameter:  {param_info['name']} ({parameter})")
    print()
    print("-"*60)
    print("COPY THIS PROMPT:")
    print("-"*60)
    print()
    print(prompt)
    print()
    print("-"*60)
    print()
    print("Usage Tips:")
    print("  1. Copy the prompt above")
    print("  2. Paste into Elicit search bar")
    print("  3. Review top 10-20 results")
    print("  4. Use the Triage Prompt to filter candidates")
    print("  5. Proceed to Extraction Prompt for priority papers")
    print()
    print("="*60)


def main():
    """Main CLI workflow."""
    try:
        # Step 1: Get material name
        material = get_material_name()
        
        # Step 2: Select dimension
        dimension = select_dimension()
        
        # Step 3: Select parameter
        parameter = select_parameter(dimension)
        
        # Step 4: Generate prompt
        prompt = generate_prompt(material, dimension, parameter)
        
        # Step 5: Display result
        display_result(material, dimension, parameter, prompt)
        
    except KeyboardInterrupt:
        print("\n\nAborted by user.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
