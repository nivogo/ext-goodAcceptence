const fetchBoxes = async () => {
  if (user && userData && userData.paad_id) {
    setLoading(true);
    setError(null);
    try {
      // İki kaynaktan veri çekiyoruz
      const boxesByPaad = await getBoxesForBasariliKoliler(userData.paad_id);
      const boxesByPreAccept = await getBoxesForBasariliKolilerByPreAccept(userData.paad_id);

      // Verileri birleştirip loglayalım
      const mergedBoxes = [...boxesByPaad, ...boxesByPreAccept];
      console.log("Merged Boxes:", mergedBoxes);

      // Çift kayıtları kaldırmak için unique sevkiyatları alıyoruz (id bazında)
      const uniqueShipments = mergedBoxes.reduce((acc, curr) => {
        if (!acc.some(item => item.id === curr.id)) {
          acc.push(curr);
        }
        return acc;
      }, []);

      // on_kabul_durumu "1" veya "2" olanları filtrele
      const validShipments = uniqueShipments.filter((shipment) => {
        const status = String(shipment.on_kabul_durumu);
        return status === "1" || status === "2";
      });
      console.log("Valid Shipments (on_kabul_durumu 1 veya 2):", validShipments);

      // Koli numarasına göre gruplandırma
      const grouped = {};
      validShipments.forEach((shipment) => {
        const boxKey = shipment.box || "Bilinmeyen Koli"; // box yoksa varsayılan değer
        if (!grouped[boxKey]) {
          grouped[boxKey] = {
            box: boxKey,
            shipment_no: shipment.shipment_no || "-",
            shipment_date: shipment.shipment_date || "-",
            totalCount: 0,    // Toplam ürün adedi (sevkiyat bazında)
            scannedCount: 0,  // Mal kabulü yapılmış ürün adedi
            from_location: shipment.from_location || "-",
          };
        }
        // Her sevkiyat bir ürün olarak sayılacak, quantity_of_product yoksa 1 varsayalım
        const qty = Number(shipment.quantity_of_product) || 1;
        grouped[boxKey].totalCount += 1; // Her sevkiyat bir ürün, qty toplamı yerine sevkiyat sayısını artırıyoruz
        // mal_kabul_durumu "1" ise okutulmuş ürün adedini artır
        if (String(shipment.mal_kabul_durumu) === "1") {
          grouped[boxKey].scannedCount += 1; // Her "1" için bir ürün say
        }
      });

      const groupedBoxes = Object.values(grouped);
      console.log("Grouped Boxes:", groupedBoxes);
      setBoxes(groupedBoxes);
    } catch (err) {
      console.error("Mal Kabul Kolileri Çekme Hatası:", err);
      setError("Mal kabul kolileri alınırken bir hata oluştu.");
    }
    setLoading(false);
  }
};
