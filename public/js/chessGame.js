const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");
let draggedPiece = null;
let sourceSquare = null;
let playerRole = "w"; 

const renderBoard = () => {
    console.log("Rendering board...");
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowIndex) => {
        row.forEach((square, squareIndex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowIndex + squareIndex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowIndex;
            squareElement.dataset.col = squareIndex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add("piece", square.color === 'w' ? "white" : "black");
                pieceElement.innerHTML = getPieceUniCode(square);

                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowIndex, col: squareIndex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };
                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === "b") {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };
    socket.emit("move", move);
};

const getPieceUniCode = (piece) => {
    const unicodePieces = {
        k: "♔", q: "♕", r: "♖", b: "♗", n: "♘", p: "♙",
        K: "♚", Q: "♛", R: "♜", B: "♝", N: "♞", P: "♟"
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    console.log("Player role updated to:", role);
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    console.log("Player is a spectator"); 
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    console.log("Updating board state with FEN:", fen); 
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    console.log("Move received:", move);
    chess.move(move);
    renderBoard();
});

renderBoard();