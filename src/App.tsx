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

// ✅ Normalizează orice număr la formatul cu „0” în față
function normalizePhone(phone: string): string {
  const onlyDigits = phone.replace(/\D/g, '');
  return onlyDigits.startsWith('0') ? onlyDigits : '0' + onlyDigits;
}

const API_URL = "https://sheetdb.io/api/v1/ohfbsp90spv39";

function App() {
  const [occupiedSeats, setOccupiedSeats] = useState<number[]>([]);
  const [ocupatBy, setOcupatBy] = useState<{ [key: number]: string }>({});
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);
  const [deletePhone, setDeletePhone] = useState('');

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
      const normalizedPhone = normalizePhone(phoneNumber);
      const checkRes = await fetch(API_URL);
      const existing = await checkRes.json();

      const alreadyReservedSeat = existing.some((rez: any) => rez.Loc === selectedSeat.toString());
      const alreadyReservedPhone = existing.some((rez: any) => normalizePhone(rez.Telefon) === normalizedPhone);

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
          Telefon: normalizedPhone,
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

  const confirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const userConfirmed = window.confirm("Ești sigur că vrei să ștergi această rezervare?");
    if (!userConfirmed) return;

    try {
      const normalizedPhone = normalizePhone(deletePhone);
      const res = await fetch(`${API_URL}/search?Telefon=${normalizedPhone}`);
      const data: { id?: string; Telefon: string; Loc: string }[] = await res.json();

      if (data.length === 0) {
        setAlert("Nu s-a găsit nicio rezervare cu acest număr.");
        setAlertType("error");
        return;
      }

      for (const rez of data) {
        const idRes = await fetch(`${API_URL}/search?Telefon=${rez.Telefon}&Loc=${rez.Loc}`);
        const idData: { id?: string; Telefon: string; Loc: string }[] = await idRes.json();

        if (idData.length > 0 && idData[0].id) {
          await fetch(`${API_URL}/${idData[0].id}`, {
            method: "DELETE"
          });
        }
      }

      setAlert("Rezervarea a fost ștearsă cu succes!");
      setAlertType("success");
      setDeletePhone('');
      setShowDeleteForm(false);

      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setAlert("Eroare la ștergere.");
      setAlertType("error");
    }
  };

  const renderSeats = () => {
    const seats = [];
    const seatsPerRow = 4;
    const fullRows = 12;

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
          <div className="w-8"></div>
          <div className="flex">{rowSeats.slice(2, 4)}</div>
        </div>
      );
    }

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
          <div className="mb-8">{renderSeats()}</div>

          <div className="flex justify-center items-center gap-2 text-gray-600 mb-8">
            <Phone size={20} />
            <p>Pentru întrebări sună la 0764717923</p>
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

          <div className="text-center mt-8">
            <button
              onClick={() => setShowDeleteForm(true)}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Șterge o rezervare
            </button>
          </div>
        </div>

        {showDeleteForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
              <button
                onClick={() => setShowDeleteForm(false)}
                className="absolute top-2 right-3 text-gray-400 hover:text-black text-xl"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-2 text-center text-red-600">Șterge o rezervare</h2>
              <p className="text-sm text-gray-600 mb-4 text-center">
                Introdu numărul de telefon exact cu care ai făcut rezervarea.
              </p>
              <form onSubmit={confirmDelete}>
                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Număr de telefon</label>
                  <input
                    type="tel"
                    value={deletePhone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setDeletePhone(value);
                      }
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
                >
                  Confirmă ștergerea rezervării
                </button>
              </form>
            </div>
          </div>
        )}

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
