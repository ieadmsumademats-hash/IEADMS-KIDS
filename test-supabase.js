const url = "https://qvsjlvdiuxuotlmdmtzr.supabase.co/rest/v1/criancas?select=*";
fetch(url, { headers: { 
  "Accept-Profile": "kids_ieadms",
  apikey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2psdmRpdXh1b3RsbWRtdHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjc2NzksImV4cCI6MjA4MjMwMzY3OX0.dc726TbFIssNIyjNAe6E5lfB0786Osb2D3KG91yOQso", 
  Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2c2psdmRpdXh1b3RsbWRtdHpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3Mjc2NzksImV4cCI6MjA4MjMwMzY3OX0.dc726TbFIssNIyjNAe6E5lfB0786Osb2D3KG91yOQso" } })
  .then(r => r.text().then(t => console.log("Status:", r.status, "Body:", t)))
  .catch(e => console.error("Error:", e.message));
