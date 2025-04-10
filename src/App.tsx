import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface SeatProps {
  number: number;
  isOccupied: boolean;
  isSelected: boolean;
  onSelect: (number: number) => void;
  name?: string;
}

const Seat: React.FC<SeatProps> = ({ number, isOccupied, isSelected, onSelect, name }) => (
  <div className="flex flex-col items-center w-14">
    {isOccupied && name && (
      <span className="text-xs text-gray-600 mb-1 text-center leading-tight break-words">
        {name.split(" ")[0]}
      </span>
    )}
    <button
      className={`w-12 h-12 rounded-lg flex items-center justify-center font-medium transition-colors
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

const seatsLayout: (number | null)[][] = [
  [1, 2, null, 3, 4],
  [5, 6, null, 7, 8],
  [9, 10, null, 11, 12],
  [13, 14, null, 49, 50],
  [17, 18, null, 15, 16],
  [21, 22, null, 19, 20],
  [25, 26, null, 23, 24],
  [27, 28, null, null, null],  // WC + USA
  [29, 30, null, 31, 32],
  [33, 34, null, 35, 36],
  [37, 38, null, 39, 40],
  [41, 42, null, 43, 44],
  [47, 48, null, 45, 46],
  [51, 52, 53, 54, 55]         // rândul din spate
];

const renderSeatsFromLayout = (
  layout: (number | null)[][],
  occupiedSeats: number[],
  selectedSeat: number | null,
  setSelectedSeat: (n: number) => void,
  ocupatBy: { [key: number]: string }
) => (
  layout.map((row, rowIndex) => (
    <div key={rowIndex} className="flex justify-center gap-2 mb-2">
      {row.map((seat, colIndex) =>
        seat ? (
          <Seat
            key={seat}
            number={seat}
            isOccupied={occupiedSeats.includes(seat)}
            isSelected={selectedSeat === seat}
            onSelect={setSelectedSeat}
            name={ocupatBy[seat]}
          />
        ) : (
          <div key={`empty-${rowIndex}-${colIndex}`} className="w-14 h-12" />
        )
      )}
    </div>
  ))
);

function App() {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [ocupatBy, setOcupatBy] = useState<{ [key: number]: string }>({});
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
  
  const API_URL = "https://sheetdb.io/api/v1/3vp18jtamzb2p";
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
    } catch {
      setAlert("Eroare la încărcarea locurilor.");
      setAlertType("error");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat) return;

    try {
      const checkRes = await fetch(API_URL);
      const existing = await checkRes.json();

      const alreadyReservedSeat = existing.some((rez: any) => rez.Loc === selectedSeat.toString());
      const alreadyReservedPhone = existing.some((rez: any) => rez.Telefon === phoneNumber);

      if (alreadyReservedSeat) {
        setAlert(`Locul ${selectedSeat} a fost deja rezervat. Se reîncarcă...`);
        setAlertType("error");
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      if (alreadyReservedPhone) {
        setAlert("Acest număr de telefon are deja o rezervare.");
        setAlertType("error");
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservation),
      });

      setSelectedSeat(null);
      setFullName('');
      setPhoneNumber('');
      setAlert("Rezervarea a fost efectuată cu succes!");
      setAlertType("success");
      await fetchOccupiedSeats();
    } catch {
      setAlert("Eroare la trimiterea rezervării.");
      setAlertType("error");
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen">Se încarcă...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Rezervare loc autobuz</h1>

        {alert && (
          <div className={`px-4 py-3 rounded mb-4 text-center font-medium ${
            alertType === 'success' ? 'bg-green-100 text-green-700 border border-green-300' :
            'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {alert}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-8">
            {renderSeatsFromLayout(seatsLayout, occupiedSeats, selectedSeat, setSelectedSeat, ocupatBy)}
          </div>

          <div className="flex justify-center mb-8">
  <a
    href="https://wa.me/40742065096"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg shadow transition"
  >
    <Phone size={20} />
    <span>Pentru întrebări sau schimbare de locuri, scrie-mi pe WhatsApp</span>
  </a>
</div>


          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Nume complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium mb-2">Număr de telefon</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    setPhoneNumber(value);
                  }
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-400"
            >
              Rezervă locul
            </button>
          </form>
        </div>

        <div className="text-center text-sm text-gray-600 mt-4">
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
