import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Users } from 'lucide-react';

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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  recipes: Recipe[];
}

interface CalendarEntry {
  id: string;
  date: string;
  menuId: string;
  menu: MenuItem;
}

interface AddMenuModalProps {
  onClose: () => void;
  onSave: (date: Date, menuId: string) => void;
  selectedDate: Date;
}

function AddMenuModal({ onClose, onSave, selectedDate }: AddMenuModalProps) {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'menus'));
        const menuData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MenuItem));
        setMenus(menuData);
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };

    fetchMenus();
  }, []);

  const filteredMenus = menus.filter(menu =>
    menu.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.recipes.some(recipe => 
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(selectedDate, selectedMenu);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Add Menu to {format(selectedDate, 'MMMM d, yyyy')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {filteredMenus.map((menu) => (
              <label
                key={menu.id}
                className={`relative flex flex-col border rounded-lg p-4 cursor-pointer ${
                  selectedMenu === menu.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="menu"
                  value={menu.id}
                  checked={selectedMenu === menu.id}
                  onChange={(e) => setSelectedMenu(e.target.value)}
                  className="sr-only"
                />
                <div className="flex gap-4">
                  {menu.recipes[0]?.image && (
                    <img
                      src={menu.recipes[0].image}
                      alt={menu.recipes[0].name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">{menu.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{menu.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {menu.recipes.map((recipe) => (
                        <span
                          key={recipe.id}
                          className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                        >
                          {recipe.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </label>
            ))}
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
              disabled={!selectedMenu}
            >
              Add to Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<Date | null>(null);

  useEffect(() => {
    const fetchCalendarEntries = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'calendar'));
        const entries = await Promise.all(
          querySnapshot.docs.map(async (docSnapshot) => {
            const data = docSnapshot.data();
            try {
              const menuDocRef = doc(db, 'menus', data.menuId);
              const menuSnapshot = await getDoc(menuDocRef);
              if (!menuSnapshot.exists()) {
                console.error(`Menu with ID ${data.menuId} not found`);
                return null;
              }
              const menuData = { id: menuSnapshot.id, ...menuSnapshot.data() };
              return {
                id: docSnapshot.id,
                ...data,
                menu: menuData
              } as CalendarEntry;
            } catch (error) {
              console.error(`Error fetching menu ${data.menuId}:`, error);
              return null;
            }
          })
        );
        setCalendarEntries(entries.filter((entry): entry is CalendarEntry => entry !== null));
      } catch (error) {
        console.error('Error fetching calendar entries:', error);
      }
    };

    fetchCalendarEntries();
  }, []);

  const weekStart = startOfWeek(currentWeek);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleAddMenu = (date: Date) => {
    setSelectedDateForModal(date);
    setIsAddModalOpen(true);
  };

  const handleSaveMenu = async (date: Date, menuId: string) => {
    try {
      const entry = {
        date: format(date, 'yyyy-MM-dd'),
        menuId
      };

      const docRef = await addDoc(collection(db, 'calendar'), entry);
      
      const menuDocRef = doc(db, 'menus', menuId);
      const menuSnapshot = await getDoc(menuDocRef);
      const menuData = { id: menuSnapshot.id, ...menuSnapshot.data() } as MenuItem;

      setCalendarEntries([
        ...calendarEntries,
        {
          id: docRef.id,
          ...entry,
          menu: menuData
        } as CalendarEntry
      ]);

      setIsAddModalOpen(false);
      setSelectedDateForModal(null);
    } catch (error) {
      console.error('Error saving calendar entry:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Meal Calendar</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePreviousWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-lg font-medium">
            {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
          </span>
          <button
            onClick={handleNextWeek}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day) => {
          const entry = calendarEntries.find(e => 
            isSameDay(new Date(e.date), day)
          );

          return (
            <div 
              key={day.toString()} 
              className={`border rounded-lg p-4 min-h-[300px] ${
                isSameDay(day, new Date()) ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <div className="text-center mb-4">
                <div className="font-semibold">{format(day, 'EEE')}</div>
                <div className="text-2xl font-bold">{format(day, 'd')}</div>
              </div>

              {entry ? (
                <div className="space-y-4">
                  <div className="bg-white rounded-lg shadow p-4">
                    {entry.menu.recipes[0]?.image && (
                      <img
                        src={entry.menu.recipes[0].image}
                        alt={entry.menu.recipes[0].name}
                        className="w-full h-32 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-medium text-lg mb-2">{entry.menu.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{entry.menu.description}</p>
                    
                    {entry.menu.recipes.map((recipe) => (
                      <div key={recipe.id} className="border-t pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0">
                        <div className="flex items-start gap-3">
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div>
                            <h4 className="font-medium">{recipe.name}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {recipe.prepTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {recipe.servings}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleAddMenu(day)}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                  <span className="ml-2">Add Menu</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isAddModalOpen && selectedDateForModal && (
        <AddMenuModal
          selectedDate={selectedDateForModal}
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedDateForModal(null);
          }}
          onSave={handleSaveMenu}
        />
      )}
    </div>
  );
}