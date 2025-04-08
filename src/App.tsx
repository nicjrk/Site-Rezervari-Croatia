import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface SeatProps {
  number: number;
  isOccupied: boolean;
  isSelected: boolean;
  onSelect: (number: number) => void;
  name?: string;
}

const Seat: React.FC<SeatProps> = ({ number, isOccupied, isSelected, onSelect, name }) => {
  return (
    <div className="flex flex-col items-center">
      {isOccupied && name && (
        <span className="text-xs text-gray-600 mb-1 max-w-[3rem] text-center leading-tight break-words">
          {name.split(" ")[0]}
        </span>
      )}
      <button
        className={`w-12 h-12 m-1 rounded-lg flex items-center justify-center font-medium transition-colors
          ${isOccupied ? 'bg-red-500 text-white cursor-not-allowed' :
            isSelected ? 'bg-green-500 text-white' : 'bg-white hover:bg-gray-100 border border-gray-300'}`}
        onClick={() => !isOccupied && onSelect(number)}
        disabled={isOccupied}
        title={isOccupied && name ? `Rezervat de ${name}` : ''}
      >
        {number}
      </button>
    </div>
  );
};

function App() {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [ocupatBy, setOcupatBy] = useState<{ [key: number]: string }>({});
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = "https://sheetdb.io/api/v1/ohfbsp90spv39";

  useEffect(() => {
    fetchOccupiedSeats();
  }, []);

  const fetchOccupiedSeats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      const data = await response.json();

      const seats: number[] = [];
      const names: { [key: number]: string } = {};

      data.forEach((rez: any) => {
        const loc = parseInt(rez.Loc);
        if (!isNaN(loc)) {
          seats.push(loc);
          names[loc] = rez.Nume || '';
        }
      });

      setOccupiedSeats(seats);
      setOcupatBy(names);
      setIsLoading(false);
    } catch (error) {
      setError('Eroare la încărcarea locurilor');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;

    try {
      // Verificare dacă locul a fost deja rezervat
      const checkRes = await fetch(API_URL);
      const existing = await checkRes.json();
      const alreadyReserved = existing.some((rez: any) => rez.Loc === selectedSeat.toString());

      if (alreadyReserved) {
        setError(`Locul ${selectedSeat} a fost deja rezervat. Alege alt loc.`);
        return;
      }

      const reservation = {
        data: {
          Nume: fullName,
          Telefon: phoneNumber,
          Loc: selectedSeat.toString(),
        },
      };

      await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservation),
      });

      setSelectedSeat(null);
      setFullName('');
      setPhoneNumber('');
      setError(null);
      await fetchOccupiedSeats();
    } catch (error) {
      setError('Eroare la rezervare.');
    }
  };

  const renderSeats = () => {
    const seats = [];
    const totalSeats = 55;
    const seatsPerRow = 4;
    const fullRows = 12; // 12x4 = 48 locuri

    for (let row = 0; row < fullRows; row++) {
      const rowSeats = [];
      for (let col = 0; col < seatsPerRow; col++) {
        const seatNumber = row * seatsPerRow + col + 1;
        rowSeats.push(
          <Seat
            key={seatNumber}
            number={seatNumber}
            isOccupied={occupiedSeats.includes(seatNumber)}
            isSelected={selectedSeat === seatNumber}
            onSelect={setSelectedSeat}
            name={ocupatBy[seatNumber]}
          />
        );
      }
      seats.push(
        <div key={row} className="flex justify-center gap-8">
          <div className="flex">{rowSeats.slice(0, 2)}</div>
          <div className="w-8"></div> {/* Spațiu pentru ușă */}
          <div className="flex">{rowSeats.slice(2, 4)}</div>
        </div>
      );
    }

    // Ultimul rând cu 5 locuri (49–53)
    const lastRow = [];
    for (let i = 0; i < 5; i++) {
      const seatNumber = fullRows * seatsPerRow + i + 1;
      lastRow.push(
        <Seat
          key={seatNumber}
          number={seatNumber}
          isOccupied={occupiedSeats.includes(seatNumber)}
          isSelected={selectedSeat === seatNumber}
          onSelect={setSelectedSeat}
          name={ocupatBy[seatNumber]}
        />
      );
    }

    seats.push(
      <div key="last-row" className="flex justify-center mt-4">
        <div className="flex gap-2">{lastRow}</div>
      </div>
    );

    return seats;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Rezervare loc autobuz</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-8">{renderSeats()}</div>

          <div className="flex justify-center items-center gap-2 text-gray-600 mb-8">
            <Phone size={20} />
            <p>Pentru întrebări sună la 0764717923</p>
          </div>

          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="mb-4">
              <label htmlFor="fullName" className="block text-gray-700 font-medium mb-2">
                Nume complet
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-2">
                Număr de telefon
              </label>
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">
                Loc selectat: {selectedSeat || 'Niciunul'}
              </label>
            </div>

            <button
              type="submit"
              disabled={!selectedSeat}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Rezervă locul
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-600">
          <div className="flex justify-center gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>Disponibil</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Ocupat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Selectat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
