import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit, Check, AlertCircle, X, Clock, Users, ChevronDown, ChevronUp, Search, Filter } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Recipe {
  id: string;
  name: string;
  description: string;
  cuisine: string;
  category: string;
  image: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  ingredients: string[];
  instructions: string[];
}

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeModalProps {
  recipe: Recipe;
  onClose: () => void;
  inventory: InventoryItem[];
}

interface RecipeFormProps {
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id'>) => void;
  initialData?: Recipe;
  isEdit?: boolean;
}

function RecipeForm({ onClose, onSave, initialData, isEdit = false }: RecipeFormProps) {
  const [formData, setFormData] = useState<Partial<Recipe>>(
    initialData || {
      name: '',
      description: '',
      cuisine: 'Italian',
      category: 'Main Course',
      image: '',
      prepTime: '',
      cookTime: '',
      servings: 4,
      ingredients: [''],
      instructions: ['']
    }
  );

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...(formData.ingredients || [])];
    newIngredients[index] = value;
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...(formData.instructions || [])];
    newInstructions[index] = value;
    setFormData({ ...formData, instructions: newInstructions });
  };

  const addIngredient = () => {
    setFormData({ ...formData, ingredients: [...(formData.ingredients || []), ''] });
  };

  const addInstruction = () => {
    setFormData({ ...formData, instructions: [...(formData.instructions || []), ''] });
  };

  const removeIngredient = (index: number) => {
    const newIngredients = formData.ingredients?.filter((_, i) => i !== index);
    setFormData({ ...formData, ingredients: newIngredients });
  };

  const removeInstruction = (index: number) => {
    const newInstructions = formData.instructions?.filter((_, i) => i !== index);
    setFormData({ ...formData, instructions: newInstructions });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as Omit<Recipe, 'id'>);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{isEdit ? 'Edit Recipe' : 'Add New Recipe'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Image URL</label>
              <input
                type="url"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Prep Time</label>
              <input
                type="text"
                value={formData.prepTime}
                onChange={(e) => setFormData({ ...formData, prepTime: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 30 mins"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cook Time</label>
              <input
                type="text"
                value={formData.cookTime}
                onChange={(e) => setFormData({ ...formData, cookTime: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 1 hour"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Servings</label>
              <input
                type="number"
                value={formData.servings}
                onChange={(e) => setFormData({ ...formData, servings: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Cuisine</label>
              <select
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {['Italian', 'Asian', 'Mexican', 'American', 'Mediterranean', 'Indian'].map((cuisine) => (
                  <option key={cuisine} value={cuisine}>{cuisine}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              rows={3}
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Ingredients</label>
              <button
                type="button"
                onClick={addIngredient}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add Ingredient
              </button>
            </div>
            <div className="space-y-2">
              {formData.ingredients?.map((ingredient, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={ingredient}
                    onChange={(e) => handleIngredientChange(index, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 2 cups flour"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">Instructions</label>
              <button
                type="button"
                onClick={addInstruction}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Add Step
              </button>
            </div>
            <div className="space-y-2">
              {formData.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <textarea
                    value={instruction}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    rows={2}
                    placeholder={`Step ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isEdit ? 'Save Changes' : 'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RecipeModal({ recipe, onClose, inventory }: RecipeModalProps) {
  const checkIngredientInStock = (ingredient: string): boolean => {
    const ingredientLower = ingredient.toLowerCase();
    return inventory.some(item => 
      item.name.toLowerCase().includes(ingredientLower)
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{recipe.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <img src={recipe.image} alt={recipe.name} className="w-full h-64 object-cover rounded-lg" />

          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Prep: {recipe.prepTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Cook: {recipe.cookTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Serves: {recipe.servings}</span>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{recipe.description}</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
            <ul className="space-y-2">
              {recipe.ingredients.map((ingredient, index) => (
                <li 
                  key={index}
                  className="flex items-center gap-2 text-sm"
                >
                  {checkIngredientInStock(ingredient) ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={checkIngredientInStock(ingredient) ? 'text-gray-700' : 'text-gray-500'}>
                    {ingredient}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Instructions</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((instruction, index) => (
                <li key={index} className="flex gap-4">
                  <span className="font-bold text-gray-400">{index + 1}.</span>
                  <p className="text-gray-600">{instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Recipes() {
  const location = useLocation();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showIngredients, setShowIngredients] = useState<{ [key: string]: boolean }>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menu'));
        const recipeData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Recipe));
        setRecipes(recipeData);
        
        const initialShowState = recipeData.reduce((acc, recipe) => ({
          ...acc,
          [recipe.id]: false
        }), {});
        setShowIngredients(initialShowState);

        if (location.state?.selectedRecipeId) {
          const selectedRecipe = recipeData.find(recipe => recipe.id === location.state.selectedRecipeId);
          if (selectedRecipe) {
            setSelectedRecipe(selectedRecipe);
          }
        }
      } catch (error) {
        console.error('Error fetching recipes:', error);
      }
    };

    const fetchInventory = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const inventoryData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as InventoryItem));
        setInventory(inventoryData);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };

    fetchRecipes();
    fetchInventory();
  }, [location.state?.selectedRecipeId]);

  const checkIngredientInStock = (ingredient: string): boolean => {
    const ingredientLower = ingredient.toLowerCase();
    return inventory.some(item => 
      item.name.toLowerCase().includes(ingredientLower)
    );
  };

  const hasAllIngredientsInStock = (recipe: Recipe): boolean => {
    return recipe.ingredients.every(ingredient => checkIngredientInStock(ingredient));
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.cuisine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.ingredients.some(ingredient => 
        ingredient.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesCategory = !categoryFilter || recipe.category === categoryFilter;
    const matchesStock = !showOnlyInStock || hasAllIngredientsInStock(recipe);
    
    return matchesSearch && matchesCategory && matchesStock;
  });

  const toggleIngredients = (recipeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowIngredients(prev => ({
      ...prev,
      [recipeId]: !prev[recipeId]
    }));
  };

  const handleAdd = () => {
    setIsAddModalOpen(true);
  };

  const handleEdit = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRecipe(recipe);
    setIsEditModalOpen(true);
  };

  const handleAddToMenu = (recipe: Recipe, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/menu', { state: { selectedRecipe: recipe } });
  };

  const handleSaveNew = async (newRecipe: Omit<Recipe, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'menu'), newRecipe);
      const savedRecipe = { ...newRecipe, id: docRef.id };
      setRecipes([...recipes, savedRecipe]);
      setShowIngredients(prev => ({
        ...prev,
        [docRef.id]: false
      }));
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding recipe:', error);
    }
  };

  const handleSaveEdit = async (editedRecipe: Omit<Recipe, 'id'>) => {
    if (!editingRecipe) return;
    
    try {
      await updateDoc(doc(db, 'menu', editingRecipe.id), editedRecipe);
      setRecipes(recipes.map(recipe => 
        recipe.id === editingRecipe.id ? { ...editedRecipe, id: editingRecipe.id } : recipe
      ));
      setIsEditModalOpen(false);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Recipes</h1>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Recipe
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Categories</option>
          {Array.from(new Set(recipes.map(recipe => recipe.category))).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <button
          onClick={() => setShowOnlyInStock(!showOnlyInStock)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showOnlyInStock 
              ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600' 
              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-5 h-5" />
          {showOnlyInStock ? 'Show All Recipes' : 'Show Only In Stock'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map((recipe) => (
          <div 
            key={recipe.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02]"
            onClick={() => setSelectedRecipe(recipe)}
          >
            <div className="relative">
              <img 
                src={recipe.image} 
                alt={recipe.name}
                className="w-full h-48 object-cover"
              />
              {hasAllIngredientsInStock(recipe) && (
                <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-sm flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  All in Stock
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{recipe.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleAddToMenu(recipe, e)}
                    className="p-1 text-blue-500 hover:text-blue-700"
                    title="Add to Menu"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleEdit(recipe, e)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm text-gray-600 mb-4">
                <span>Prep: {recipe.prepTime}</span>
                <span>Cook: {recipe.cookTime}</span>
                <span>Serves: {recipe.servings}</span>
              </div>
              
              <div>
                <button
                  onClick={(e) => toggleIngredients(recipe.id, e)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-2"
                >
                  <span className="font-medium">Ingredients</span>
                  {showIngredients[recipe.id] ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                
                {showIngredients[recipe.id] && (
                  <ul className="space-y-1 mt-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li 
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        {checkIngredientInStock(ingredient) ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={checkIngredientInStock(ingredient) ? 'text-gray-700' : 'text-gray-500'}>
                          {ingredient}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          inventory={inventory}
        />
      )}

      {isAddModalOpen && (
        <RecipeForm
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNew}
        />
      )}

      {isEditModalOpen && editingRecipe && (
        <RecipeForm
          initialData={editingRecipe}
          isEdit
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingRecipe(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}