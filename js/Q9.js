d3.csv("../data_ggsheet.csv").then(function(data) {
  // --- Chuẩn hóa dữ liệu ---
  let grouped = d3.rollups(
    data,
    v => new Set(v.map(d => d["Mã đơn hàng"])).size,
    d => d["Mã nhóm hàng"],
    d => d["Tên nhóm hàng"],
    d => d["Mã mặt hàng"],
    d => d["Tên mặt hàng"]
  );

  let merged = [];
  grouped.forEach(([maNhom, tenNhomGroups]) => {
    tenNhomGroups.forEach(([tenNhom, maMHGroups]) => {
      let tong = 0;
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          tong += soDH;
        });
      });
      maMHGroups.forEach(([maMH, tenMHGroups]) => {
        tenMHGroups.forEach(([tenMH, soDH]) => {
          merged.push({
            Nhom: maNhom,
            TenNhom: tenNhom,
            MaMH: maMH,
            TenMH: tenMH,
            HienThi: `[${maMH}] ${tenMH}`,
            XacSuat: soDH / tong
          });
        });
      });
    });
  });

  // --- Gom nhóm theo Nhóm hàng ---
  const groupedByNhom = d3.groups(merged, d => d.TenNhom);

  // --- SVG chia grid ---
  const svg = d3.select("#chart9"),
        totalWidth = +svg.attr("width"),
        totalHeight = +svg.attr("height");

  const cols = 3;   // số cột subplot
  const rows = Math.ceil(groupedByNhom.length / cols);
  const cellWidth = totalWidth / cols;
  const cellHeight = totalHeight / rows;

  // --- Vẽ từng subplot ---
  groupedByNhom.forEach(([tenNhom, arr], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    // thêm margin.left để label không bị che
    const margin = { top: 70, right: 40, bottom: 40, left: 160 };

    const g = svg.append("g")
      .attr("transform", `translate(${col * cellWidth + margin.left},${row * cellHeight + margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, d3.max(arr, d => d.XacSuat)])
      .range([0, cellWidth - margin.left - margin.right]);

    const y = d3.scaleBand()
      .domain(arr.sort((a, b) => d3.descending(a.XacSuat, b.XacSuat)).map(d => d.HienThi))
      .range([0, cellHeight - margin.top - margin.bottom])
      .padding(0.2);

    // 🎨 Thang màu dịu hơn
    const color = d3.scaleOrdinal()
      .domain(arr.map(d => d.HienThi))
      .range(d3.schemeSet2);

    // Trục X
    g.append("g")
      .attr("transform", `translate(0,${cellHeight - margin.top - margin.bottom})`)
      .call(d3.axisBottom(x).tickFormat(d3.format(".0%")).ticks(5));

    // Trục Y (label dài sẽ wrap xuống dòng)
    g.append("g")
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll("text")
      .style("font-size", "11px")
      .style("font-weight", "bold")
      .call(wrap, 150); // wrap label dài trong khung 150px

    g.select(".domain").remove();

    // Bar + Tooltip
    g.selectAll("rect")
      .data(arr)
      .enter().append("rect")
        .attr("y", d => y(d.HienThi))
        .attr("width", d => x(d.XacSuat))
        .attr("height", y.bandwidth())
        .attr("fill", d => color(d.HienThi))
      .append("title")   // ✅ Tooltip dạng SVG
        .text(d => `${d.HienThi}\nXác suất: ${(d.XacSuat*100).toFixed(2)}%`);

    // Label %
    g.selectAll("text.value")
      .data(arr)
      .enter().append("text")
        .attr("class", "value")
        .attr("x", d => x(d.XacSuat) + 5)
        .attr("y", d => y(d.HienThi) + y.bandwidth()/2 + 4)
        .text(d => d3.format(".0%")(d.XacSuat))
        .style("font-size", "11px")
        .style("font-weight", "bold");

    // Sub-title
    g.append("text")
      .attr("class", "sub-title")
      .attr("x", (cellWidth - margin.left - margin.right) / 2)
      .attr("y", -15)
      .attr("text-anchor", "middle")
      .style("font-size", "13px")
      .style("font-weight", "bold")
      .text(`[${arr[0].Nhom}] ${tenNhom}`);
  });

  // --- Tiêu đề chung ---
  svg.append("text")
    .attr("x", totalWidth / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Xác suất bán hàng theo Mặt hàng trong từng Nhóm hàng");

  // --- Hàm wrap text ---
  function wrap(text, width) {
    text.each(function() {
      var text = d3.select(this),
          words = text.text().split(/\s+/).reverse(),
          word,
          line = [],
          lineNumber = 0,
          lineHeight = 1.1,
          y = text.attr("y"),
          dy = parseFloat(text.attr("dy")) || 0,
          tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", dy + "em");
      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(" "));
        if (tspan.node().getComputedTextLength() > width) {
          line.pop();
          tspan.text(line.join(" "));
          line = [word];
          tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
        }
      }
    });
  }
});
