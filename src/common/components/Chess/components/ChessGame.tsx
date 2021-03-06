import React from 'react';
import _isEqual from 'lodash-es/isEqual';
import _isEmpty from 'lodash-es/isEmpty';
import _uniqWith from 'lodash-es/uniqWith';
import styles from '../chess.module.css';
import ChessBoard from './ChessBoard';
import ChessPieceRenderer from './ChessPieceRenderer';
import ChessSquare from './ChessSquare';
import IChessPiece from './IChessPiece';
import { ChessPosition } from './types';

type ChessGameProps = {};

type ChessGameStates = {
    focused?: string;
    movablePositions: Array<ChessPosition> | null;
    catched: Array<IChessPiece>;
};

class ChessGame extends React.Component<ChessGameProps, ChessGameStates> {
    chessBoard: ChessBoard;

    constructor(props: ChessGameProps) {
        super(props);
        this.chessBoard = new ChessBoard();
        this.state = {
            focused: undefined,
            movablePositions: null,
            catched: [],
        };
    }

    generatePieceId(piece?: IChessPiece) {
        return (
            piece &&
            `${piece.getName()}_${piece.getColor()}_${piece.getPosition().v}_${
                piece.getPosition().h
            }`
        );
    }

    handleClickPiece(piece: IChessPiece) {
        const pieceId = this.generatePieceId(piece);
        // deselect if re-click
        if (pieceId === this.state.focused) {
            this.setState({
                focused: undefined,
                movablePositions: null,
            });
            return;
        }
        // catch enemy
        if (this.state.movablePositions?.some((pos) => _isEqual(pos, piece.getPosition()))) {
            this.setState({
                catched: [...this.state.catched, piece],
            });
            const square = this.chessBoard.getSquare(piece.getPosition());
            if (square) {
                square.setPiece();
                this.handlePieceMoving(square);
            }
            return;
        }
        // click piece
        const movablePos = piece.getMovablePositions() || [];
        const catchablePos = piece.getCatchablePositions(true) || [];
        if (_isEmpty(movablePos) && _isEmpty(catchablePos)) {
            this.setState({
                focused: pieceId,
                movablePositions: null,
            });
            return;
        }
        this.setState({
            focused: pieceId,
            movablePositions: _uniqWith([...movablePos, ...catchablePos], _isEqual),
        });
    }

    isMovableSquare(square: ChessSquare) {
        const { movablePositions } = this.state;
        if (!movablePositions || movablePositions.length === 0) {
            return false;
        }
        return movablePositions.some((pos) => _isEqual(pos, square.getPosition()));
    }

    handlePieceMoving(square: ChessSquare) {
        const currentSquare = this.chessBoard
            .getChessSquares()
            .find((square) => this.generatePieceId(square.getPiece()) === this.state.focused);
        if (currentSquare) {
            const piece = currentSquare.getPiece();
            const castling = this.handleCastling(square, piece);
            piece?.setPosition(square.getPosition());
            this.setState({ focused: undefined, movablePositions: null }, () => {
                square.setPiece(piece);
                currentSquare.setPiece();
                if (castling) {
                    const { newRookSquare, rook, oldRookSquare } = castling;
                    newRookSquare?.setPiece(rook);
                    oldRookSquare?.setPiece();
                }
            });
        }
    }

    handleCastling(square: ChessSquare, picece?: IChessPiece) {
        if (!picece || picece.getName() !== 'king' || picece.getIsMoved()) {
            return;
        }
        if (square.getPosition().v === 7) {
            const rookSquare = this.chessBoard.getSquare({ h: picece.getPosition().h, v: 8 });
            const rook = rookSquare?.getPiece();
            rook?.setPosition({ h: picece.getPosition().h, v: 6 });
            return {
                newRookSquare: this.chessBoard.getSquare({ h: picece.getPosition().h, v: 6 }),
                rook,
                oldRookSquare: rookSquare,
            };
        }
        if (square.getPosition().v === 3) {
            const rookSquare = this.chessBoard.getSquare({ h: picece.getPosition().h, v: 1 });
            const rook = rookSquare?.getPiece();
            rook?.setPosition({ h: picece.getPosition().h, v: 4 });
            return {
                newRookSquare: this.chessBoard.getSquare({ h: picece.getPosition().h, v: 4 }),
                rook,
                oldRookSquare: rookSquare,
            };
        }
    }

    handleClickSquare(square: ChessSquare, isMove?: boolean) {
        if (isMove) {
            this.handlePieceMoving(square);
        }
    }

    render() {
        const { focused } = this.state;

        return (
            <div className={styles.board}>
                {this.chessBoard.getChessSquares().map((square, index) => {
                    const piece: IChessPiece | undefined = square.getPiece();
                    const isMovableSquare = this.isMovableSquare(square);
                    let className = `${styles.square} ${
                        square.getColor() === 'black' ? styles.squareBlack : styles.squareWhite
                    } ${isMovableSquare ? styles.movable : styles.unmovable}`;
                    if (piece) {
                        className += ` ${styles.movableHasPiece}`;
                    }
                    return (
                        <React.Fragment key={index}>
                            <div
                                className={className}
                                style={{
                                    gridColumn: square.getPosition().v,
                                    gridRow: 9 - square.getPosition().h,
                                }}
                                onClick={() => this.handleClickSquare(square, isMovableSquare)}
                            />
                            {piece && (
                                <ChessPieceRenderer
                                    name={piece.getName()}
                                    position={piece.getPosition()}
                                    color={piece.getColor()}
                                    onClick={() => this.handleClickPiece(piece)}
                                    isFocused={this.generatePieceId(piece) === focused}
                                />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        );
    }
}

export default ChessGame;
