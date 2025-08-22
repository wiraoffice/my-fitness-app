import Dexie from "dexie";

export const db = new Dexie("myfitness");
db.version(1).stores({
  daily_logs: "date", // primary key = "YYYY-MM-DD"
  prefs: "key"        // key-value untuk pengaturan
});

// ------------ Helpers CRUD -------------
export const putDaily = (date, entry) =>
  db.daily_logs.put({
    date,
    ...entry,
    updatedAt: Date.now(),
  });

export const getDaily = (date) => db.daily_logs.get(date);

export const getRange = async (startISO, endISO) => {
  // semua item dengan date di [startISO..endISO]
  return db.daily_logs
    .where("date")
    .between(startISO, endISO, true, true)
    .toArray();
};

// prefs
export const putPref = (key, data) => db.prefs.put({ key, data });
export const getPref = async (key, fallback = null) => {
  const row = await db.prefs.get(key);
  return row?.data ?? fallback;
};
