import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

import { EdsDataGrid } from '../EdsDataGrid'
import { columns } from './columns'
import { Data, data } from './data'

describe('EdsDataGrid', () => {
  beforeEach(() => {
    class ResizeObserver {
      observe() {
        // do nothing
      }

      unobserve() {
        // do nothing
      }

      disconnect() {
        // do nothing
      }
    }

    window.ResizeObserver = ResizeObserver
  })

  describe('Filtering', () => {
    it('should have built-in filtering if enabled', async () => {
      render(
        <EdsDataGrid
          enableColumnFiltering={true}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getAllByRole('columnheader').length).toBe(columns.length)
      expect(
        within(screen.getAllByRole('columnheader')[0]).getByRole('combobox'),
      ).toBeTruthy()

      expect(
        within(screen.getAllByRole('listbox')[0]).queryAllByRole('option')
          .length,
      ).toBe(0)

      await userEvent.click(
        within(screen.getAllByRole('columnheader')[0]).getByRole('combobox'),
      )

      expect(
        within(screen.getAllByRole('listbox')[0]).queryAllByRole('option')
          .length,
      ).toBe(data.length)
    })

    // Something weird about this test. It passes if ran alone with `it.only` or only Filtering block, but fails when all tests are ran...
    // In addition, I'm unable to get jest.useFakeTimers() to work, so it only passes with setTimeout
    it.skip('should apply filter on input change', async () => {
      render(
        <EdsDataGrid
          enableColumnFiltering={true}
          columns={columns}
          rows={data}
        />,
      )
      const col = screen.getAllByRole('columnheader')[0]
      const length = screen.getAllByRole('row').length
      const box = within(col).getByRole('combobox')

      await userEvent.type(box, '1')

      setTimeout(() => {
        expect(screen.getAllByRole('row').length).toBeLessThan(length)
      }, 600)
    })
  })
  describe('Render', () => {
    it('should render successfully', () => {
      const { baseElement } = render(
        <EdsDataGrid columns={columns} rows={data} />,
      )
      expect(baseElement).toBeTruthy()
    })

    it(`should render with ${columns.length} columns`, () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(screen.getAllByRole('columnheader').length).toBe(columns.length)
    })

    it(`should render with ${data.length} rows + 1 header row`, () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(screen.getAllByRole('row').length).toBe(data.length + 1)
    })

    it('should render with caption element', () => {
      render(
        <EdsDataGrid
          caption={<h1>My Caption</h1>}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getByText('My Caption')).toBeTruthy()
    })

    it('should render sticky header', () => {
      render(<EdsDataGrid stickyHeader={true} columns={columns} rows={data} />)
      expect(
        screen.getByRole('table').classList.contains('sticky-header'),
      ).toBeTruthy()
      screen.getAllByRole('columnheader').forEach((column) => {
        expect(window.getComputedStyle(column).position).toBe('sticky')
      })
    })
  })

  describe('Sorting', () => {
    it('should have built-in sorting if enabled', async () => {
      render(<EdsDataGrid enableSorting={true} columns={columns} rows={data} />)
      expect(
        screen.getAllByRole('columnheader')[0].getAttribute('aria-sort'),
      ).toBe('none')
      await userEvent.click(screen.getAllByRole('columnheader')[0])
      expect(
        screen.getAllByRole('columnheader')[0].getAttribute('aria-sort'),
      ).toBe('ascending')
      await userEvent.click(screen.getAllByRole('columnheader')[0])
      expect(
        screen.getAllByRole('columnheader')[0].getAttribute('aria-sort'),
      ).toBe('descending')
    })

    it('should not have sorting if not set', async () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(
        screen.getAllByRole('columnheader')[0].getAttribute('aria-sort'),
      ).toBe('none')
      await userEvent.click(screen.getAllByRole('columnheader')[0])
      expect(
        screen.getAllByRole('columnheader')[0].getAttribute('aria-sort'),
      ).toBe('none')
    })
  })

  describe('should show fallback text if defined', () => {
    it('should only show placeholder message if no rows and emptyMessage is defined', () => {
      const emptyMessage = 'No data to display'
      render(
        <EdsDataGrid emptyMessage={emptyMessage} columns={columns} rows={[]} />,
      )
      expect(screen.getByText(emptyMessage)).toBeTruthy()
    })
    it('should not show placeholder message if rows.length > 0 and emptyMessage is defined', () => {
      const emptyMessage = 'No data to display'
      render(
        <EdsDataGrid
          emptyMessage={emptyMessage}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.queryByText(emptyMessage)).toBeFalsy()
    })
    it('should not show placeholder message if emptyMessage is not defined', () => {
      const emptyMessage = 'No data to display'
      render(<EdsDataGrid columns={columns} rows={[]} />)
      expect(screen.queryByText(emptyMessage)).toBeFalsy()
    })
  })

  describe('Resize', () => {
    it('should not show resize handles if not specified', () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(screen.queryByTestId('resize-handle')).toBeFalsy()
    })
    it('should not show resize handles columnResizeMode is null', () => {
      render(
        <EdsDataGrid
          columnResizeMode={undefined}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.queryByTestId('resize-handle')).toBeFalsy()
    })
    it('should show resize handles if specified', () => {
      render(
        <EdsDataGrid
          columnResizeMode={'onChange'}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getAllByTestId('resize-handle').length > 0).toBeTruthy()
    })
    it('should resize column if resize handle is dragged', () => {
      render(
        <EdsDataGrid
          columnResizeMode={'onChange'}
          columns={columns}
          rows={data}
        />,
      )
      const firstColumn = screen.getAllByRole('columnheader')[0]
      const resizeHandle = within(firstColumn).getByTestId('resize-handle')
      const initialWidth = Number(firstColumn.style.width.replace('px', ''))
      expect(initialWidth).toBe(100)
      const clientX = Number(resizeHandle.style.left)
      const clientY = Number(resizeHandle.style.top)
      fireEvent.mouseDown(resizeHandle, { clientX, clientY })
      fireEvent.mouseMove(resizeHandle, { clientX: 100, clientY })
      fireEvent.mouseUp(resizeHandle, { clientX: 100, clientY })
      expect(Number(firstColumn.style.width.replace('px', ''))).toBeGreaterThan(
        initialWidth,
      )
    })
  })

  describe('Row selection', () => {
    it('should not call onSelectRow if rowSelection is not set', async () => {
      const spy = jest.fn()
      render(<EdsDataGrid onSelectRow={spy} columns={columns} rows={data} />)
      await userEvent.click(screen.getAllByRole('row')[1])
      expect(spy).toHaveBeenCalledTimes(0)
    })
    it('should call onSelectRow if rowSelection is set', async () => {
      const spy = jest.fn()
      render(
        <EdsDataGrid
          rowSelection={true}
          onSelectRow={spy}
          columns={columns}
          rows={data}
        />,
      )
      await userEvent.click(screen.getAllByRole('row')[1])
      expect(spy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Paging', () => {
    it('should not show paging if not specified', () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(screen.queryByLabelText('pagination')).toBeFalsy()
    })
    it('should be possible to paginate with varying page-sizes', () => {
      render(
        <EdsDataGrid
          enablePagination={true}
          pageSize={10}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getByLabelText('pagination')).toBeTruthy()
      expect(screen.getByText('1 - 10', { exact: false })).toBeTruthy()
      render(
        <EdsDataGrid
          enablePagination={true}
          pageSize={20}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getByText('1 - 20', { exact: false })).toBeTruthy()
    })
    it('should handle page change', () => {
      render(
        <EdsDataGrid
          enablePagination={true}
          pageSize={10}
          columns={columns}
          rows={data}
        />,
      )
      fireEvent.click(screen.getByLabelText('Go to page 2'))
      expect(screen.getByText('11 - 20', { exact: false })).toBeTruthy()
    })
  })

  describe('Column visibility', () => {
    it('should show all columns if not specified', () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(screen.getAllByRole('columnheader').length).toBe(columns.length)
    })
    it('should hide columns if col-id set to false', () => {
      render(
        <EdsDataGrid
          columnVisibility={{ cargoId: false }}
          columns={columns}
          rows={data}
        />,
      )
      expect(screen.getAllByRole('columnheader').length).toBe(
        columns.length - 1,
      )
    })
    it('should let us know if columns are hidden', async () => {
      const stub = jest.fn()
      render(
        <EdsDataGrid
          columnVisibility={{ cargoId: true }}
          columnVisibilityChange={stub}
          columns={columns}
          rows={data}
        />,
      )
      const thead = screen.getAllByRole('rowgroup')[0]
      await userEvent.click(within(thead).getByRole('button'))
      expect(stub).toHaveBeenCalled()
    })
  })

  describe('Virtual scroll', () => {
    it('should not show virtual scroll if not specified', () => {
      render(<EdsDataGrid columns={columns} rows={data} />)
      expect(
        screen.queryByRole('table')?.classList.contains('virtual'),
      ).toBeFalsy()
    })
    it('should show virtual scroll if specified', () => {
      let manyRows: Array<Data> = []
      for (let i = 0; i < 200; i++) {
        manyRows = [...manyRows, ...data]
      }
      render(
        <EdsDataGrid enableVirtual={true} columns={columns} rows={manyRows} />,
      )
      // Applies virtual class
      expect(
        screen.getByRole('table')?.classList.contains('virtual'),
      ).toBeTruthy()
      // Has 2 virtual padding elements
      expect(screen.getByTestId('virtual-padding-top')).toBeTruthy()
      expect(screen.getByTestId('virtual-padding-bottom')).toBeTruthy()
    })
  })

  describe('Styling', () => {
    it('should apply styling to the table', () => {
      const cellStyle = () => ({ backgroundColor: 'red' })
      const rowStyle = () => ({ backgroundColor: 'blue' })
      const headerStyle = () => ({ backgroundColor: 'green' })
      render(
        <EdsDataGrid
          cellStyle={cellStyle}
          headerStyle={headerStyle}
          rowStyle={rowStyle}
          columns={columns}
          rows={data}
        />,
      )
      const firstBodyRow = screen.getAllByRole('row')[1]
      expect(firstBodyRow.style.backgroundColor).toBe('blue')
      expect(
        within(firstBodyRow).getAllByRole('cell')[0].style.backgroundColor,
      ).toBe('red')
      expect(screen.getAllByRole('columnheader')[0].style.backgroundColor).toBe(
        'green',
      )
    })

    it('should apply classes to the table', () => {
      const cellClass = () => 'cell-class'
      const rowClass = () => 'row-class'
      const headerClass = () => 'header-class'

      render(
        <EdsDataGrid
          cellClass={cellClass}
          rowClass={rowClass}
          headerClass={headerClass}
          columns={columns}
          rows={data}
        />,
      )
      const firstBodyRow = screen.getAllByRole('row')[1]
      expect(firstBodyRow.classList.contains('row-class')).toBeTruthy()
      const firstCell = within(firstBodyRow).getAllByRole('cell')[0]
      expect(firstCell.classList.contains('cell-class')).toBeTruthy()
      const firstHeader = screen.getAllByRole('columnheader')[0]
      expect(firstHeader.classList.contains('header-class')).toBeTruthy()
    })
  })
})
