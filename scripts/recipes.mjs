/*
 Acquired by running the following lua script in a game:

  /c local list = {}
  list[#list+1] = "{"
  local firstRecipe = true;
  for _, recipe in pairs(game.player.force.recipes) do 
    if firstRecipe then
      firstRecipe = false
    else
      list[#list] = list[#list] .. ","
    end
    list[#list+1] = "  \"" .. recipe.name .. "\": {"
    list[#list+1] = "    \"ingredients\": ["
    local start = true
    for _, ingredient in pairs(recipe.ingredients) do
      if start then
        start = false
      else
        list[#list] = list[#list] .. ","
      end
      list[#list+1] = "      {"
      list[#list+1] = "        \"name\": \"" .. product.name .. "\","
      list[#list+1] = "        \"amount\": " .. product.amount
      list[#list+1] = "      }"
    end
    list[#list+1] = "    ],"
    list[#list+1] = "    \"energy\": " .. recipe.energy .. ","
    list[#list+1] = "  }"
  end
  list[#list+1] = "};"
  for _, string in pairs(list) do
    game.write_file("recipes.txt", string .. "\n", true)
  end

 with some massaging of the formatting after.
*/
export const recipes = {
  accumulator: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
      {
        name: 'battery',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'accumulator',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'advanced-circuit': {
    ingredients: [
      {
        name: 'plastic-bar',
        amount: 2,
      },
      {
        name: 'copper-cable',
        amount: 4,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'advanced-circuit',
        amount: 1,
      },
    ],
    energy: 6,
  },
  'arithmetic-combinator': {
    ingredients: [
      {
        name: 'copper-cable',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'arithmetic-combinator',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'artillery-shell': {
    ingredients: [
      {
        name: 'explosives',
        amount: 8,
      },
      {
        name: 'explosive-cannon-shell',
        amount: 4,
      },
      {
        name: 'radar',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'artillery-shell',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'artillery-targeting-remote': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 1,
      },
      {
        name: 'radar',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'artillery-targeting-remote',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'artillery-turret': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 60,
      },
      {
        name: 'iron-gear-wheel',
        amount: 40,
      },
      {
        name: 'advanced-circuit',
        amount: 20,
      },
      {
        name: 'concrete',
        amount: 60,
      },
    ],
    products: [
      {
        name: 'artillery-turret',
        amount: 1,
      },
    ],
    energy: 40,
  },
  'artillery-wagon': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 40,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 20,
      },
      {
        name: 'engine-unit',
        amount: 64,
      },
      {
        name: 'pipe',
        amount: 16,
      },
    ],
    products: [
      {
        name: 'artillery-wagon',
        amount: 1,
      },
    ],
    energy: 4,
  },
  'assembling-machine-1': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 9,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'assembling-machine-1',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'assembling-machine-2': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'assembling-machine-1',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'assembling-machine-2',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'assembling-machine-3': {
    ingredients: [
      {
        name: 'assembling-machine-2',
        amount: 2,
      },
      {
        name: 'speed-module',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'assembling-machine-3',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'atomic-bomb': {
    ingredients: [
      {
        name: 'explosives',
        amount: 10,
      },
      {
        name: 'rocket-control-unit',
        amount: 10,
      },
      {
        name: 'uranium-235',
        amount: 30,
      },
    ],
    products: [
      {
        name: 'atomic-bomb',
        amount: 1,
      },
    ],
    energy: 50,
  },
  'automation-science-pack': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'automation-science-pack',
        amount: 1,
      },
    ],
    energy: 5,
  },
  battery: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'copper-plate',
        amount: 1,
      },
      {
        name: 'sulfuric-acid',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'battery',
        amount: 1,
      },
    ],
    energy: 4,
  },
  'battery-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'battery',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'battery-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'battery-mk2-equipment': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 15,
      },
      {
        name: 'low-density-structure',
        amount: 5,
      },
      {
        name: 'battery-equipment',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'battery-mk2-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  beacon: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'copper-cable',
        amount: 10,
      },
      {
        name: 'electronic-circuit',
        amount: 20,
      },
      {
        name: 'advanced-circuit',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'beacon',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'belt-immunity-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'belt-immunity-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'big-electric-pole': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'iron-stick',
        amount: 8,
      },
    ],
    products: [
      {
        name: 'big-electric-pole',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  boiler: {
    ingredients: [
      {
        name: 'pipe',
        amount: 4,
      },
      {
        name: 'stone-furnace',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'boiler',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'burner-inserter': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'burner-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'burner-mining-drill': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 3,
      },
      {
        name: 'iron-gear-wheel',
        amount: 3,
      },
      {
        name: 'stone-furnace',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'burner-mining-drill',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'cannon-shell': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'plastic-bar',
        amount: 2,
      },
      {
        name: 'explosives',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'cannon-shell',
        amount: 1,
      },
    ],
    energy: 8,
  },
  car: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 20,
      },
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'engine-unit',
        amount: 8,
      },
    ],
    products: [
      {
        name: 'car',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'cargo-wagon': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 20,
      },
      {
        name: 'steel-plate',
        amount: 20,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'cargo-wagon',
        amount: 1,
      },
    ],
    energy: 1,
  },
  centrifuge: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 50,
      },
      {
        name: 'iron-gear-wheel',
        amount: 100,
      },
      {
        name: 'advanced-circuit',
        amount: 100,
      },
      {
        name: 'concrete',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'centrifuge',
        amount: 1,
      },
    ],
    energy: 4,
  },
  'chemical-plant': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'pipe',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'chemical-plant',
        amount: 1,
      },
    ],
    energy: 5,
  },
  'chemical-science-pack': {
    ingredients: [
      {
        name: 'sulfur',
        amount: 1,
      },
      {
        name: 'advanced-circuit',
        amount: 3,
      },
      {
        name: 'engine-unit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'chemical-science-pack',
        amount: 2,
      },
    ],
    energy: 24,
  },
  'cliff-explosives': {
    ingredients: [
      {
        name: 'explosives',
        amount: 10,
      },
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'grenade',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'cliff-explosives',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'cluster-grenade': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'explosives',
        amount: 5,
      },
      {
        name: 'grenade',
        amount: 7,
      },
    ],
    products: [
      {
        name: 'cluster-grenade',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'combat-shotgun': {
    ingredients: [
      {
        name: 'wood',
        amount: 10,
      },
      {
        name: 'copper-plate',
        amount: 10,
      },
      {
        name: 'steel-plate',
        amount: 15,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'combat-shotgun',
        amount: 1,
      },
    ],
    energy: 10,
  },
  concrete: {
    ingredients: [
      {
        name: 'iron-ore',
        amount: 1,
      },
      {
        name: 'stone-brick',
        amount: 5,
      },
      {
        name: 'water',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'concrete',
        amount: 10,
      },
    ],
    energy: 10,
  },
  'constant-combinator': {
    ingredients: [
      {
        name: 'copper-cable',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'constant-combinator',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'construction-robot': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 2,
      },
      {
        name: 'flying-robot-frame',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'construction-robot',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'copper-cable': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'copper-cable',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  'copper-plate': {
    ingredients: [
      {
        name: 'copper-ore',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'copper-plate',
        amount: 1,
      },
    ],
    energy: 3.2,
  },
  'decider-combinator': {
    ingredients: [
      {
        name: 'copper-cable',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'decider-combinator',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'defender-capsule': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 3,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'piercing-rounds-magazine',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'defender-capsule',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'destroyer-capsule': {
    ingredients: [
      {
        name: 'speed-module',
        amount: 1,
      },
      {
        name: 'distractor-capsule',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'destroyer-capsule',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'discharge-defense-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 20,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'laser-turret',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'discharge-defense-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'discharge-defense-remote': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'discharge-defense-remote',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'distractor-capsule': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 3,
      },
      {
        name: 'defender-capsule',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'distractor-capsule',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'effectivity-module': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'effectivity-module',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'effectivity-module-2': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'effectivity-module',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'effectivity-module-2',
        amount: 1,
      },
    ],
    energy: 30,
  },
  'effectivity-module-3': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'effectivity-module-2',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'effectivity-module-3',
        amount: 1,
      },
    ],
    energy: 60,
  },
  'electric-energy-interface': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'electric-energy-interface',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'electric-engine-unit': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 2,
      },
      {
        name: 'engine-unit',
        amount: 1,
      },
      {
        name: 'lubricant',
        amount: 15,
      },
    ],
    products: [
      {
        name: 'electric-engine-unit',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'electric-furnace': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'stone-brick',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'electric-furnace',
        amount: 1,
      },
    ],
    energy: 5,
  },
  'electric-mining-drill': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'electric-mining-drill',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'electronic-circuit': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'copper-cable',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'empty-barrel': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
    ],
    energy: 1,
  },
  'energy-shield-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'energy-shield-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'energy-shield-mk2-equipment': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'low-density-structure',
        amount: 5,
      },
      {
        name: 'energy-shield-equipment',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'energy-shield-mk2-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'engine-unit': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
      {
        name: 'pipe',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'engine-unit',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'exoskeleton-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 20,
      },
      {
        name: 'processing-unit',
        amount: 10,
      },
      {
        name: 'electric-engine-unit',
        amount: 30,
      },
    ],
    products: [
      {
        name: 'exoskeleton-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'explosive-cannon-shell': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'plastic-bar',
        amount: 2,
      },
      {
        name: 'explosives',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'explosive-cannon-shell',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'explosive-rocket': {
    ingredients: [
      {
        name: 'explosives',
        amount: 2,
      },
      {
        name: 'rocket',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'explosive-rocket',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'explosive-uranium-cannon-shell': {
    ingredients: [
      {
        name: 'uranium-238',
        amount: 1,
      },
      {
        name: 'explosive-cannon-shell',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'explosive-uranium-cannon-shell',
        amount: 1,
      },
    ],
    energy: 12,
  },
  explosives: {
    ingredients: [
      {
        name: 'coal',
        amount: 1,
      },
      {
        name: 'sulfur',
        amount: 1,
      },
      {
        name: 'water',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'explosives',
        amount: 2,
      },
    ],
    energy: 4,
  },
  'express-loader': {
    ingredients: [
      {
        name: 'express-transport-belt',
        amount: 5,
      },
      {
        name: 'fast-loader',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'express-loader',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'express-splitter': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 10,
      },
      {
        name: 'fast-splitter',
        amount: 1,
      },
      {
        name: 'lubricant',
        amount: 80,
      },
    ],
    products: [
      {
        name: 'express-splitter',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'express-transport-belt': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'fast-transport-belt',
        amount: 1,
      },
      {
        name: 'lubricant',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'express-transport-belt',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'express-underground-belt': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 80,
      },
      {
        name: 'fast-underground-belt',
        amount: 2,
      },
      {
        name: 'lubricant',
        amount: 40,
      },
    ],
    products: [
      {
        name: 'express-underground-belt',
        amount: 2,
      },
    ],
    energy: 2,
  },
  'fast-inserter': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
      {
        name: 'inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'fast-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'fast-loader': {
    ingredients: [
      {
        name: 'fast-transport-belt',
        amount: 5,
      },
      {
        name: 'loader',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'fast-loader',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'fast-splitter': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'electronic-circuit',
        amount: 10,
      },
      {
        name: 'splitter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'fast-splitter',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'fast-transport-belt': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'transport-belt',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'fast-transport-belt',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'fast-underground-belt': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 40,
      },
      {
        name: 'underground-belt',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'fast-underground-belt',
        amount: 2,
      },
    ],
    energy: 2,
  },
  'filter-inserter': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 4,
      },
      {
        name: 'fast-inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'filter-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'firearm-magazine': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'firearm-magazine',
        amount: 1,
      },
    ],
    energy: 1,
  },
  flamethrower: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'flamethrower',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'flamethrower-ammo': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'crude-oil',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'flamethrower-ammo',
        amount: 1,
      },
    ],
    energy: 6,
  },
  'flamethrower-turret': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 30,
      },
      {
        name: 'iron-gear-wheel',
        amount: 15,
      },
      {
        name: 'engine-unit',
        amount: 5,
      },
      {
        name: 'pipe',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'flamethrower-turret',
        amount: 1,
      },
    ],
    energy: 20,
  },
  'fluid-wagon': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 16,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'storage-tank',
        amount: 1,
      },
      {
        name: 'pipe',
        amount: 8,
      },
    ],
    products: [
      {
        name: 'fluid-wagon',
        amount: 1,
      },
    ],
    energy: 1.5,
  },
  'flying-robot-frame': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'battery',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'electric-engine-unit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'flying-robot-frame',
        amount: 1,
      },
    ],
    energy: 20,
  },
  'fusion-reactor-equipment': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 200,
      },
      {
        name: 'low-density-structure',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'fusion-reactor-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  gate: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
      {
        name: 'stone-wall',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'gate',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'green-wire': {
    ingredients: [
      {
        name: 'copper-cable',
        amount: 1,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'green-wire',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  grenade: {
    ingredients: [
      {
        name: 'coal',
        amount: 10,
      },
      {
        name: 'iron-plate',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'grenade',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'gun-turret': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 20,
      },
      {
        name: 'copper-plate',
        amount: 10,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'gun-turret',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'hazard-concrete': {
    ingredients: [
      {
        name: 'concrete',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'hazard-concrete',
        amount: 10,
      },
    ],
    energy: 0.25,
  },
  'heat-exchanger': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 100,
      },
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'pipe',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'heat-exchanger',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'heat-pipe': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 20,
      },
      {
        name: 'steel-plate',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'heat-pipe',
        amount: 1,
      },
    ],
    energy: 1,
  },
  'heavy-armor': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 100,
      },
      {
        name: 'steel-plate',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'heavy-armor',
        amount: 1,
      },
    ],
    energy: 8,
  },
  inserter: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'iron-chest': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 8,
      },
    ],
    products: [
      {
        name: 'iron-chest',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'iron-gear-wheel': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'iron-plate': {
    ingredients: [
      {
        name: 'iron-ore',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'iron-plate',
        amount: 1,
      },
    ],
    energy: 3.2,
  },
  'iron-stick': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'iron-stick',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  lab: {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'electronic-circuit',
        amount: 10,
      },
      {
        name: 'transport-belt',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'lab',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'land-mine': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'explosives',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'land-mine',
        amount: 4,
      },
    ],
    energy: 5,
  },
  landfill: {
    ingredients: [
      {
        name: 'stone',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'landfill',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'laser-turret': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 20,
      },
      {
        name: 'battery',
        amount: 12,
      },
      {
        name: 'electronic-circuit',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'laser-turret',
        amount: 1,
      },
    ],
    energy: 20,
  },
  'light-armor': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 40,
      },
    ],
    products: [
      {
        name: 'light-armor',
        amount: 1,
      },
    ],
    energy: 3,
  },
  loader: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'transport-belt',
        amount: 5,
      },
      {
        name: 'inserter',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'loader',
        amount: 1,
      },
    ],
    energy: 1,
  },
  locomotive: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 30,
      },
      {
        name: 'electronic-circuit',
        amount: 10,
      },
      {
        name: 'engine-unit',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'locomotive',
        amount: 1,
      },
    ],
    energy: 4,
  },
  'logistic-chest-active-provider': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-chest-active-provider',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-chest-buffer': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-chest-buffer',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-chest-passive-provider': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-chest-passive-provider',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-chest-requester': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-chest-requester',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-chest-storage': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 3,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-chest-storage',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-robot': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 2,
      },
      {
        name: 'flying-robot-frame',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-robot',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'logistic-science-pack': {
    ingredients: [
      {
        name: 'transport-belt',
        amount: 1,
      },
      {
        name: 'inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'logistic-science-pack',
        amount: 1,
      },
    ],
    energy: 6,
  },
  'long-handed-inserter': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
      {
        name: 'inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'long-handed-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'low-density-structure': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 20,
      },
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'plastic-bar',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'low-density-structure',
        amount: 1,
      },
    ],
    energy: 20,
  },
  lubricant: {
    ingredients: [
      {
        name: 'heavy-oil',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'lubricant',
        amount: 10,
      },
    ],
    energy: 1,
  },
  'medium-electric-pole': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 2,
      },
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'iron-stick',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'medium-electric-pole',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'military-science-pack': {
    ingredients: [
      {
        name: 'piercing-rounds-magazine',
        amount: 1,
      },
      {
        name: 'grenade',
        amount: 1,
      },
      {
        name: 'stone-wall',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'military-science-pack',
        amount: 2,
      },
    ],
    energy: 10,
  },
  'modular-armor': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 50,
      },
      {
        name: 'advanced-circuit',
        amount: 30,
      },
    ],
    products: [
      {
        name: 'modular-armor',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'night-vision-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'night-vision-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'nuclear-fuel': {
    ingredients: [
      {
        name: 'rocket-fuel',
        amount: 1,
      },
      {
        name: 'uranium-235',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'nuclear-fuel',
        amount: 1,
      },
    ],
    energy: 90,
  },
  'nuclear-reactor': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 500,
      },
      {
        name: 'steel-plate',
        amount: 500,
      },
      {
        name: 'advanced-circuit',
        amount: 500,
      },
      {
        name: 'concrete',
        amount: 500,
      },
    ],
    products: [
      {
        name: 'nuclear-reactor',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'offshore-pump': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
      {
        name: 'pipe',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'offshore-pump',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'oil-refinery': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 15,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'electronic-circuit',
        amount: 10,
      },
      {
        name: 'pipe',
        amount: 10,
      },
      {
        name: 'stone-brick',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'oil-refinery',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'personal-laser-defense-equipment': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 20,
      },
      {
        name: 'low-density-structure',
        amount: 5,
      },
      {
        name: 'laser-turret',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'personal-laser-defense-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'personal-roboport-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 20,
      },
      {
        name: 'battery',
        amount: 45,
      },
      {
        name: 'iron-gear-wheel',
        amount: 40,
      },
      {
        name: 'advanced-circuit',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'personal-roboport-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'personal-roboport-mk2-equipment': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 100,
      },
      {
        name: 'low-density-structure',
        amount: 20,
      },
      {
        name: 'personal-roboport-equipment',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'personal-roboport-mk2-equipment',
        amount: 1,
      },
    ],
    energy: 20,
  },
  'piercing-rounds-magazine': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'firearm-magazine',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'piercing-rounds-magazine',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'piercing-shotgun-shell': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'shotgun-shell',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'piercing-shotgun-shell',
        amount: 1,
      },
    ],
    energy: 8,
  },
  pipe: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'pipe',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'pipe-to-ground': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'pipe',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'pipe-to-ground',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  pistol: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'copper-plate',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'pistol',
        amount: 1,
      },
    ],
    energy: 5,
  },
  'plastic-bar': {
    ingredients: [
      {
        name: 'coal',
        amount: 1,
      },
      {
        name: 'petroleum-gas',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'plastic-bar',
        amount: 2,
      },
    ],
    energy: 1,
  },
  'poison-capsule': {
    ingredients: [
      {
        name: 'coal',
        amount: 10,
      },
      {
        name: 'steel-plate',
        amount: 3,
      },
      {
        name: 'electronic-circuit',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'poison-capsule',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'power-armor': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 40,
      },
      {
        name: 'processing-unit',
        amount: 40,
      },
      {
        name: 'electric-engine-unit',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'power-armor',
        amount: 1,
      },
    ],
    energy: 20,
  },
  'power-armor-mk2': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 60,
      },
      {
        name: 'electric-engine-unit',
        amount: 40,
      },
      {
        name: 'low-density-structure',
        amount: 30,
      },
      {
        name: 'speed-module-2',
        amount: 25,
      },
      {
        name: 'effectivity-module-2',
        amount: 25,
      },
    ],
    products: [
      {
        name: 'power-armor-mk2',
        amount: 1,
      },
    ],
    energy: 25,
  },
  'power-switch': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'copper-cable',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'power-switch',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'processing-unit': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 20,
      },
      {
        name: 'advanced-circuit',
        amount: 2,
      },
      {
        name: 'sulfuric-acid',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'processing-unit',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'production-science-pack': {
    ingredients: [
      {
        name: 'rail',
        amount: 30,
      },
      {
        name: 'electric-furnace',
        amount: 1,
      },
      {
        name: 'productivity-module',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'production-science-pack',
        amount: 3,
      },
    ],
    energy: 21,
  },
  'productivity-module': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'productivity-module',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'productivity-module-2': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'productivity-module',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'productivity-module-2',
        amount: 1,
      },
    ],
    energy: 30,
  },
  'productivity-module-3': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'productivity-module-2',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'productivity-module-3',
        amount: 1,
      },
    ],
    energy: 60,
  },
  'programmable-speaker': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 3,
      },
      {
        name: 'copper-cable',
        amount: 5,
      },
      {
        name: 'iron-stick',
        amount: 4,
      },
      {
        name: 'electronic-circuit',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'programmable-speaker',
        amount: 1,
      },
    ],
    energy: 2,
  },
  pump: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'engine-unit',
        amount: 1,
      },
      {
        name: 'pipe',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'pump',
        amount: 1,
      },
    ],
    energy: 2,
  },
  pumpjack: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'pipe',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'pumpjack',
        amount: 1,
      },
    ],
    energy: 5,
  },
  radar: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'radar',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  rail: {
    ingredients: [
      {
        name: 'stone',
        amount: 1,
      },
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'iron-stick',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'rail',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  'rail-chain-signal': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'rail-chain-signal',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'rail-signal': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'rail-signal',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'red-wire': {
    ingredients: [
      {
        name: 'copper-cable',
        amount: 1,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'red-wire',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'refined-concrete': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1,
      },
      {
        name: 'iron-stick',
        amount: 8,
      },
      {
        name: 'concrete',
        amount: 20,
      },
      {
        name: 'water',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'refined-concrete',
        amount: 10,
      },
    ],
    energy: 15,
  },
  'refined-hazard-concrete': {
    ingredients: [
      {
        name: 'refined-concrete',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'refined-hazard-concrete',
        amount: 10,
      },
    ],
    energy: 0.25,
  },
  'repair-pack': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'repair-pack',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  roboport: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 45,
      },
      {
        name: 'iron-gear-wheel',
        amount: 45,
      },
      {
        name: 'advanced-circuit',
        amount: 45,
      },
    ],
    products: [
      {
        name: 'roboport',
        amount: 1,
      },
    ],
    energy: 5,
  },
  rocket: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
      {
        name: 'explosives',
        amount: 1,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'rocket',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'rocket-control-unit': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 1,
      },
      {
        name: 'speed-module',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'rocket-control-unit',
        amount: 1,
      },
    ],
    energy: 30,
  },
  'rocket-fuel': {
    ingredients: [
      {
        name: 'solid-fuel',
        amount: 10,
      },
      {
        name: 'light-oil',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'rocket-fuel',
        amount: 1,
      },
    ],
    energy: 30,
  },
  'rocket-launcher': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'rocket-launcher',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'rocket-part': {
    ingredients: [
      {
        name: 'rocket-control-unit',
        amount: 10,
      },
      {
        name: 'low-density-structure',
        amount: 10,
      },
      {
        name: 'rocket-fuel',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'rocket-part',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'rocket-silo': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 1000,
      },
      {
        name: 'processing-unit',
        amount: 200,
      },
      {
        name: 'electric-engine-unit',
        amount: 200,
      },
      {
        name: 'pipe',
        amount: 100,
      },
      {
        name: 'concrete',
        amount: 1000,
      },
    ],
    products: [
      {
        name: 'rocket-silo',
        amount: 1,
      },
    ],
    energy: 30,
  },
  satellite: {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 100,
      },
      {
        name: 'low-density-structure',
        amount: 100,
      },
      {
        name: 'rocket-fuel',
        amount: 50,
      },
      {
        name: 'solar-panel',
        amount: 100,
      },
      {
        name: 'accumulator',
        amount: 100,
      },
      {
        name: 'radar',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'satellite',
        amount: 1,
      },
    ],
    energy: 5,
  },
  shotgun: {
    ingredients: [
      {
        name: 'wood',
        amount: 5,
      },
      {
        name: 'iron-plate',
        amount: 15,
      },
      {
        name: 'copper-plate',
        amount: 10,
      },
      {
        name: 'iron-gear-wheel',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'shotgun',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'shotgun-shell': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 2,
      },
      {
        name: 'copper-plate',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'shotgun-shell',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'slowdown-capsule': {
    ingredients: [
      {
        name: 'coal',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 2,
      },
      {
        name: 'electronic-circuit',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'slowdown-capsule',
        amount: 1,
      },
    ],
    energy: 8,
  },
  'small-electric-pole': {
    ingredients: [
      {
        name: 'wood',
        amount: 1,
      },
      {
        name: 'copper-cable',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'small-electric-pole',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  'small-lamp': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'copper-cable',
        amount: 3,
      },
      {
        name: 'electronic-circuit',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'small-lamp',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'solar-panel': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 15,
      },
    ],
    products: [
      {
        name: 'solar-panel',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'solar-panel-equipment': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 5,
      },
      {
        name: 'advanced-circuit',
        amount: 2,
      },
      {
        name: 'solar-panel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'solar-panel-equipment',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'speed-module': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'speed-module',
        amount: 1,
      },
    ],
    energy: 15,
  },
  'speed-module-2': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'speed-module',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'speed-module-2',
        amount: 1,
      },
    ],
    energy: 30,
  },
  'speed-module-3': {
    ingredients: [
      {
        name: 'advanced-circuit',
        amount: 5,
      },
      {
        name: 'processing-unit',
        amount: 5,
      },
      {
        name: 'speed-module-2',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'speed-module-3',
        amount: 1,
      },
    ],
    energy: 60,
  },
  spidertron: {
    ingredients: [
      {
        name: 'raw-fish',
        amount: 1,
      },
      {
        name: 'rocket-control-unit',
        amount: 16,
      },
      {
        name: 'low-density-structure',
        amount: 150,
      },
      {
        name: 'effectivity-module-3',
        amount: 2,
      },
      {
        name: 'rocket-launcher',
        amount: 4,
      },
      {
        name: 'fusion-reactor-equipment',
        amount: 2,
      },
      {
        name: 'exoskeleton-equipment',
        amount: 4,
      },
      {
        name: 'radar',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'spidertron',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'spidertron-remote': {
    ingredients: [
      {
        name: 'rocket-control-unit',
        amount: 1,
      },
      {
        name: 'radar',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'spidertron-remote',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  splitter: {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'transport-belt',
        amount: 4,
      },
    ],
    products: [
      {
        name: 'splitter',
        amount: 1,
      },
    ],
    energy: 1,
  },
  'stack-filter-inserter': {
    ingredients: [
      {
        name: 'electronic-circuit',
        amount: 5,
      },
      {
        name: 'stack-inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'stack-filter-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'stack-inserter': {
    ingredients: [
      {
        name: 'iron-gear-wheel',
        amount: 15,
      },
      {
        name: 'electronic-circuit',
        amount: 15,
      },
      {
        name: 'advanced-circuit',
        amount: 1,
      },
      {
        name: 'fast-inserter',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'stack-inserter',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'steam-engine': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'iron-gear-wheel',
        amount: 8,
      },
      {
        name: 'pipe',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'steam-engine',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'steam-turbine': {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 50,
      },
      {
        name: 'iron-gear-wheel',
        amount: 50,
      },
      {
        name: 'pipe',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'steam-turbine',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'steel-chest': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 8,
      },
    ],
    products: [
      {
        name: 'steel-chest',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'steel-furnace': {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 6,
      },
      {
        name: 'stone-brick',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'steel-furnace',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'steel-plate': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'steel-plate',
        amount: 1,
      },
    ],
    energy: 16,
  },
  'stone-brick': {
    ingredients: [
      {
        name: 'stone',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'stone-brick',
        amount: 1,
      },
    ],
    energy: 3.2,
  },
  'stone-furnace': {
    ingredients: [
      {
        name: 'stone',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'stone-furnace',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'stone-wall': {
    ingredients: [
      {
        name: 'stone-brick',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'stone-wall',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'storage-tank': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 20,
      },
      {
        name: 'steel-plate',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'storage-tank',
        amount: 1,
      },
    ],
    energy: 3,
  },
  'submachine-gun': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'iron-gear-wheel',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'submachine-gun',
        amount: 1,
      },
    ],
    energy: 10,
  },
  substation: {
    ingredients: [
      {
        name: 'copper-plate',
        amount: 5,
      },
      {
        name: 'steel-plate',
        amount: 10,
      },
      {
        name: 'advanced-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'substation',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  sulfur: {
    ingredients: [
      {
        name: 'water',
        amount: 30,
      },
      {
        name: 'petroleum-gas',
        amount: 30,
      },
    ],
    products: [
      {
        name: 'sulfur',
        amount: 2,
      },
    ],
    energy: 1,
  },
  'sulfuric-acid': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'sulfur',
        amount: 5,
      },
      {
        name: 'water',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'sulfuric-acid',
        amount: 50,
      },
    ],
    energy: 1,
  },
  tank: {
    ingredients: [
      {
        name: 'steel-plate',
        amount: 50,
      },
      {
        name: 'iron-gear-wheel',
        amount: 15,
      },
      {
        name: 'advanced-circuit',
        amount: 10,
      },
      {
        name: 'engine-unit',
        amount: 32,
      },
    ],
    products: [
      {
        name: 'tank',
        amount: 1,
      },
    ],
    energy: 5,
  },
  'train-stop': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 6,
      },
      {
        name: 'steel-plate',
        amount: 3,
      },
      {
        name: 'iron-stick',
        amount: 6,
      },
      {
        name: 'electronic-circuit',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'train-stop',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'transport-belt': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 1,
      },
      {
        name: 'iron-gear-wheel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'transport-belt',
        amount: 2,
      },
    ],
    energy: 0.5,
  },
  'underground-belt': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'transport-belt',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'underground-belt',
        amount: 2,
      },
    ],
    energy: 1,
  },
  'uranium-cannon-shell': {
    ingredients: [
      {
        name: 'uranium-238',
        amount: 1,
      },
      {
        name: 'cannon-shell',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'uranium-cannon-shell',
        amount: 1,
      },
    ],
    energy: 12,
  },
  'uranium-fuel-cell': {
    ingredients: [
      {
        name: 'iron-plate',
        amount: 10,
      },
      {
        name: 'uranium-235',
        amount: 1,
      },
      {
        name: 'uranium-238',
        amount: 19,
      },
    ],
    products: [
      {
        name: 'uranium-fuel-cell',
        amount: 10,
      },
    ],
    energy: 10,
  },
  'uranium-rounds-magazine': {
    ingredients: [
      {
        name: 'uranium-238',
        amount: 1,
      },
      {
        name: 'piercing-rounds-magazine',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'uranium-rounds-magazine',
        amount: 1,
      },
    ],
    energy: 10,
  },
  'utility-science-pack': {
    ingredients: [
      {
        name: 'processing-unit',
        amount: 2,
      },
      {
        name: 'flying-robot-frame',
        amount: 1,
      },
      {
        name: 'low-density-structure',
        amount: 3,
      },
    ],
    products: [
      {
        name: 'utility-science-pack',
        amount: 3,
      },
    ],
    energy: 21,
  },
  'wooden-chest': {
    ingredients: [
      {
        name: 'wood',
        amount: 2,
      },
    ],
    products: [
      {
        name: 'wooden-chest',
        amount: 1,
      },
    ],
    energy: 0.5,
  },
  'basic-oil-processing': {
    ingredients: [
      {
        name: 'crude-oil',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'petroleum-gas',
        amount: 45,
      },
    ],
    energy: 5,
  },
  'advanced-oil-processing': {
    ingredients: [
      {
        name: 'water',
        amount: 50,
      },
      {
        name: 'crude-oil',
        amount: 100,
      },
    ],
    products: [
      {
        name: 'heavy-oil',
        amount: 25,
      },
      {
        name: 'light-oil',
        amount: 45,
      },
      {
        name: 'petroleum-gas',
        amount: 55,
      },
    ],
    energy: 5,
  },
  'coal-liquefaction': {
    ingredients: [
      {
        name: 'coal',
        amount: 10,
      },
      {
        name: 'heavy-oil',
        amount: 25,
      },
      {
        name: 'steam',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'heavy-oil',
        amount: 90,
      },
      {
        name: 'light-oil',
        amount: 20,
      },
      {
        name: 'petroleum-gas',
        amount: 10,
      },
    ],
    energy: 5,
  },
  'fill-crude-oil-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'crude-oil',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'crude-oil-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-heavy-oil-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'heavy-oil',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'heavy-oil-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-light-oil-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'light-oil',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'light-oil-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-lubricant-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'lubricant',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'lubricant-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-petroleum-gas-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'petroleum-gas',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'petroleum-gas-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-sulfuric-acid-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'sulfuric-acid',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'sulfuric-acid-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'fill-water-barrel': {
    ingredients: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'water',
        amount: 50,
      },
    ],
    products: [
      {
        name: 'water-barrel',
        amount: 1,
      },
    ],
    energy: 0.2,
  },
  'heavy-oil-cracking': {
    ingredients: [
      {
        name: 'water',
        amount: 30,
      },
      {
        name: 'heavy-oil',
        amount: 40,
      },
    ],
    products: [
      {
        name: 'light-oil',
        amount: 30,
      },
    ],
    energy: 2,
  },
  'light-oil-cracking': {
    ingredients: [
      {
        name: 'water',
        amount: 30,
      },
      {
        name: 'light-oil',
        amount: 30,
      },
    ],
    products: [
      {
        name: 'petroleum-gas',
        amount: 20,
      },
    ],
    energy: 2,
  },
  'solid-fuel-from-light-oil': {
    ingredients: [
      {
        name: 'light-oil',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'solid-fuel',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'solid-fuel-from-petroleum-gas': {
    ingredients: [
      {
        name: 'petroleum-gas',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'solid-fuel',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'solid-fuel-from-heavy-oil': {
    ingredients: [
      {
        name: 'heavy-oil',
        amount: 20,
      },
    ],
    products: [
      {
        name: 'solid-fuel',
        amount: 1,
      },
    ],
    energy: 2,
  },
  'empty-crude-oil-barrel': {
    ingredients: [
      {
        name: 'crude-oil-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'crude-oil',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-heavy-oil-barrel': {
    ingredients: [
      {
        name: 'heavy-oil-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'heavy-oil',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-light-oil-barrel': {
    ingredients: [
      {
        name: 'light-oil-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'light-oil',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-lubricant-barrel': {
    ingredients: [
      {
        name: 'lubricant-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'lubricant',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-petroleum-gas-barrel': {
    ingredients: [
      {
        name: 'petroleum-gas-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'petroleum-gas',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-sulfuric-acid-barrel': {
    ingredients: [
      {
        name: 'sulfuric-acid-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'sulfuric-acid',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'empty-water-barrel': {
    ingredients: [
      {
        name: 'water-barrel',
        amount: 1,
      },
    ],
    products: [
      {
        name: 'empty-barrel',
        amount: 1,
      },
      {
        name: 'water',
        amount: 50,
      },
    ],
    energy: 0.2,
  },
  'uranium-processing': {
    ingredients: [
      {
        name: 'uranium-ore',
        amount: 10,
      },
    ],
    products: [
      {
        name: 'uranium-235',
        amount: 1,
      },
      {
        name: 'uranium-238',
        amount: 1,
      },
    ],
    energy: 12,
  },
  'nuclear-fuel-reprocessing': {
    ingredients: [
      {
        name: 'used-up-uranium-fuel-cell',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'uranium-238',
        amount: 3,
      },
    ],
    energy: 60,
  },
  'kovarex-enrichment-process': {
    ingredients: [
      {
        name: 'uranium-235',
        amount: 40,
      },
      {
        name: 'uranium-238',
        amount: 5,
      },
    ],
    products: [
      {
        name: 'uranium-235',
        amount: 41,
      },
      {
        name: 'uranium-238',
        amount: 2,
      },
    ],
    energy: 60,
  },
};
