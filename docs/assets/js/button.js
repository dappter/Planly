document.getElementById('saibaMais').addEventListener('click', function () {
  document.getElementById('formulario').scrollIntoView({
    behavior: 'smooth'
  });
});

document.getElementById("gerarExemplo").addEventListener("click", function () {
    const formSection = document.getElementById("formulario");
    formSection.scrollIntoView({ behavior: "smooth" });
});