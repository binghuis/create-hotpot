import { clone } from 'lodash-es';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import './index.less';

interface ITableDragSelectProps extends React.HTMLAttributes<Element> {
  value: any;
  maxRows?: number;
  maxColumns?: number;
  onSelectionStart?: (...args: any[]) => any;
  onInput?: (...args: any[]) => any;
  onChange?: (...args: any[]) => any;
}

interface TableDragSelectState {
  selectionStarted?: boolean;
  startRow?: any;
  startColumn?: any;
  endRow?: any;
  endColumn?: any;
  addMode?: boolean;
}

const TableDragSelect: React.FC<ITableDragSelectProps> & {
  Td?: (props: any) => any;
  Tr?: (props: any) => any;
} = (props) => {
  const [state, setState] = useState<TableDragSelectState>({
    selectionStarted: false,
    startRow: null,
    startColumn: null,
    endRow: null,
    endColumn: null,
    addMode: undefined,
  });
  const handleTouchEndWindow = useCallback(
    (e: MouseEvent | TouchEvent) => {
      const isLeftClick = 'button' in e && e.button === 0;
      const isTouch = e.type !== 'mousedown';
      if (state.selectionStarted && (isLeftClick || isTouch)) {
        const value = clone(props.value);
        const minRow = Math.min(state.startRow, state.endRow);
        const maxRow = Math.max(state.startRow, state.endRow);

        for (let row = minRow; row <= maxRow; row++) {
          const minColumn = Math.min(state.startColumn, state.endColumn);
          const maxColumn = Math.max(state.startColumn, state.endColumn);

          for (let column = minColumn; column <= maxColumn; column++) {
            value[row][column] = state.addMode;
          }
        }

        setState((v) => ({ ...v, selectionStarted: false }));
        props?.onChange?.(value);
      }
    },
    [
      props,
      state.addMode,
      state.endColumn,
      state.endRow,
      state.selectionStarted,
      state.startColumn,
      state.startRow,
    ],
  );

  useEffect(() => {
    window.addEventListener('mouseup', handleTouchEndWindow);
    window.addEventListener('touchend', handleTouchEndWindow);
    return () => {
      window.removeEventListener('mouseup', handleTouchEndWindow);
      window.removeEventListener('touchend', handleTouchEndWindow);
    };
  }, [handleTouchEndWindow]);

  // Takes a mouse or touch event and returns the corresponding row and cell.
  // Example:
  // eventToCellLocation(event);
  // {row: 2, column: 3}

  const eventToCellLocation = (e: TouchEvent) => {
    let target;
    // For touchmove and touchend events, e.target and e.touches[n].target are
    // wrong, so we have to rely on elementFromPoint(). For mouse clicks, we have
    // to use e.target.
    if (e.touches) {
      const touch = e.touches[0];
      target = document.elementFromPoint(touch.clientX, touch.clientY);
    } else {
      target = e.target;
      while (target.tagName !== 'TD') {
        target = (target as any)?.parentNode;
      }
    }
    return {
      row: target.parentNode.rowIndex,
      column: target.cellIndex,
    };
  };

  const handleTouchStartCell = (e: TouchEvent) => {
    const isLeftClick = 'button' in e && e.button === 0;
    const isTouch = e.type !== 'mousedown';
    if (!state.selectionStarted && (isLeftClick || isTouch)) {
      e.preventDefault();
      const { row, column } = eventToCellLocation(e);
      props?.onSelectionStart?.({ row, column });
      setState({
        selectionStarted: true,
        startRow: row,
        startColumn: column,
        endRow: row,
        endColumn: column,
        addMode: !props.value[row][column],
      });
    }
  };
  const handleTouchMoveCell = (e: TouchEvent) => {
    if (state.selectionStarted) {
      e.preventDefault();
      const { row, column } = eventToCellLocation(e);
      const { startRow, startColumn, endRow, endColumn } = state;
      if (endRow !== row || endColumn !== column) {
        const nextRowCount =
          startRow === null && endRow === null
            ? 0
            : Math.abs(row - startRow) + 1;
        const nextColumnCount =
          startColumn === null && endColumn === null
            ? 0
            : Math.abs(column - startColumn) + 1;
        if (props?.maxRows && nextRowCount <= props?.maxRows) {
          setState((v) => ({ ...v, endRow: row }));
        }
        if (props?.maxColumns && nextColumnCount <= props?.maxColumns) {
          setState((v) => ({ ...v, endColumn: column }));
        }
      }
    }
  };

  const isCellBeingSelected = (row: number, column: number) => {
    const minRow = Math.min(state.startRow, state.endRow);
    const maxRow = Math.max(state.startRow, state.endRow);
    const minColumn = Math.min(state.startColumn, state.endColumn);
    const maxColumn = Math.max(state.startColumn, state.endColumn);
    return (
      state.selectionStarted &&
      row >= minRow &&
      row <= maxRow &&
      column >= minColumn &&
      column <= maxColumn
    );
  };

  const renderRows = () =>
    React.Children.map(props.children, (tr: any, i) => {
      return (
        <tr key={i} {...tr.props}>
          {React.Children.map(tr.props.children, (cell, j) => {
            const cellProps = cell?.props ?? {};
            return (
              <Cell
                key={j}
                onTouchStart={handleTouchStartCell}
                onTouchMove={handleTouchMoveCell}
                selected={props.value[i][j]}
                beingSelected={isCellBeingSelected(i, j)}
                {...cellProps}
              >
                {cellProps.children}
              </Cell>
            );
          })}
        </tr>
      );
    });

  return (
    <table className="table-drag-select">
      <tbody>{renderRows()}</tbody>
    </table>
  );
};

TableDragSelect.defaultProps = {
  value: [],
  maxRows: Infinity,
  maxColumns: Infinity,
  onSelectionStart: () => {
    //
  },
  onInput: () => {
    //
  },
  onChange: () => {
    //
  },
};

TableDragSelect.Tr = (props: { childrens?: React.ReactNode }) => {
  return <tr></tr>;
};

TableDragSelect.Td = (props: { childrens?: React.ReactNode }) => {
  return <td></td>;
};

export default TableDragSelect;

interface ICellProps extends React.HTMLAttributes<Element> {
  className?: any;
  disabled?: any;
  beingSelected?: any;
  selected?: any;
  onTouchStart?: any;
  onTouchMove?: any;
  props?: any;
}

const Cell: React.FC<ICellProps> = (cellProps) => {
  const td = useRef<HTMLTableDataCellElement>();

  useEffect(() => {
    const tdEle = td.current;
    tdEle?.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    tdEle?.addEventListener('touchmove', handleTouchMove, {
      passive: false,
    });

    return () => {
      tdEle?.removeEventListener('touchstart', handleTouchStart);
      tdEle?.removeEventListener('touchmove', handleTouchMove);
    };
  });

  const handleTouchStart = (e: TouchEvent) => {
    if (!cellProps.disabled) {
      cellProps.onTouchStart(e);
    }
  };
  const handleTouchMove = (e: TouchEvent) => {
    if (!cellProps.disabled) {
      cellProps.onTouchMove(e);
    }
  };
  let { className = '' } = cellProps;
  const {
    disabled,
    beingSelected,
    selected,
    onTouchStart,
    onTouchMove,
    ...props
  } = cellProps;

  if (disabled) {
    className += ' cell-disabled';
  } else {
    className += ' cell-enabled';
    if (selected) {
      className += ' cell-selected';
    }
    if (beingSelected) {
      className += ' cell-being-selected';
    }
  }

  return (
    <td
      ref={td as any}
      className={className}
      onMouseDown={handleTouchStart as any}
      onMouseMove={handleTouchMove as any}
      {...props}
    >
      {props.children || <span>&nbsp;</span>}
    </td>
  );
};
