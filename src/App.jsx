import React, { useState, useEffect } from "react";
import "./App.css";
import io from "socket.io-client";

const socket = io("https://backboat-production.up.railway.app"); // Conecta ao backend

const App = () => {
  const [nickname, setNickname] = useState("");
  const [gameStarted, setGameStarted] = useState(false);
  const [leftSide, setLeftSide] = useState(["Lobo", "Ovelha", "Couve"]);
  const [rightSide, setRightSide] = useState([]);
  const [boat, setBoat] = useState([]);
  const [isBoatOnLeft, setIsBoatOnLeft] = useState(true);
  const [message, setMessage] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    socket.on("updateLeaderboard", (data) => {
      setLeaderboard(data);
    });

    return () => {
      socket.off("updateLeaderboard");
    };
  }, []);

  const startGame = () => {
    if (!nickname) {
      setMessage("Por favor, insira seu nickname!");
      return;
    }
    setGameStarted(true);
    setStartTime(Date.now());
    setMessage("");
  };

  const moveItemToBoat = (item) => {
    if (boat.length < 1 && isBoatOnLeft && leftSide.includes(item)) {
      setBoat([...boat, item]);
      setLeftSide(leftSide.filter((i) => i !== item));
    } else if (boat.length < 1 && !isBoatOnLeft && rightSide.includes(item)) {
      setBoat([...boat, item]);
      setRightSide(rightSide.filter((i) => i !== item));
    }
  };

  const removeItemFromBoat = (item) => {
    if (isBoatOnLeft) {
      setLeftSide([...leftSide, item]);
    } else {
      setRightSide([...rightSide, item]);
    }
    setBoat(boat.filter((i) => i !== item));
  };

  const moveBoat = () => {
    setIsBoatOnLeft(!isBoatOnLeft);
  
    const validateState = () => {
      if (isBoatOnLeft && leftSide.includes("Lobo") && leftSide.includes("Ovelha")) {
        setMessage("O Lobo comeu a Ovelha! Você perdeu.");
        resetGame();
      } else if (isBoatOnLeft && leftSide.includes("Ovelha") && leftSide.includes("Couve")) {
        setMessage("A Ovelha comeu a Couve! Você perdeu.");
        resetGame();
      } else if (!isBoatOnLeft && rightSide.includes("Lobo") && rightSide.includes("Ovelha")) {
        setMessage("O Lobo comeu a Ovelha! Você perdeu.");
        resetGame();
      } else if (!isBoatOnLeft && rightSide.includes("Ovelha") && rightSide.includes("Couve")) {
        setMessage("A Ovelha comeu a Couve! Você perdeu.");
        resetGame();
      }
    };
  
    setTimeout(validateState, 500);
  };
  

  const resetGame = () => {
    setLeftSide(["Lobo", "Ovelha", "Couve"]);
    setRightSide([]);
    setBoat([]);
    setIsBoatOnLeft(true);
    setStartTime(null);
    setGameStarted(false);
  };

  useEffect(() => {
    if (rightSide.length === 3 && rightSide.includes("Lobo") && rightSide.includes("Ovelha") && rightSide.includes("Couve")) {
      const timeTaken = (Date.now() - startTime) / 1000;
      setMessage(`Parabéns, ${nickname}! Você venceu em ${timeTaken.toFixed(2)} segundos!`);

      // Envia os dados ao servidor
      socket.emit("gameCompleted", { nickname, time: timeTaken });
    }
  }, [rightSide]);

  return (
    <div className="game">
      {!gameStarted ? (
        <div>
          <h1>Pastor, Ovelha, Lobo e Couve</h1>
          <input
            type="text"
            placeholder="Digite seu nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <button onClick={startGame}>Iniciar Jogo</button>
          <p>{message}</p>
        </div>
      ) : (
        <div>
          <h1>Pastor, Ovelha, Lobo e Couve</h1>
          <p>{message}</p>
          <div className="river">
            <div className="left-side">
              <h3>Lado Esquerdo</h3>
              <ul>
                {leftSide.map((item) => (
                  <li key={item}>
                    {item} <button onClick={() => moveItemToBoat(item)}>Mover para o Barco</button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="boat">
              <h3>Barco ({isBoatOnLeft ? "Esquerda" : "Direita"})</h3>
              <ul>
                {boat.map((item) => (
                  <li key={item}>
                    {item} <button onClick={() => removeItemFromBoat(item)}>Remover do Barco</button>
                  </li>
                ))}
              </ul>
              <button onClick={moveBoat}>Mover o Barco</button>
            </div>
            <div className="right-side">
              <h3>Lado Direito</h3>
              <ul>
                {rightSide.map((item) => (
                  <li key={item}>
                    {item} <button onClick={() => moveItemToBoat(item)}>Mover para o Barco</button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      <div className="leaderboard">
        <h2>Ranking</h2>
        <ul>
          {leaderboard.map((player, index) => (
            <li key={index}>
              {index + 1}. {player.nickname} - {player.time.toFixed(2)} segundos
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;
