import { arrayEach } from '../../helpers/array';
import { rangeEach } from '../../helpers/number';
import { hasOwnProperty } from '../../helpers/object';
import { getTranslator } from '../../utils/recordTranslator';

/**
 * Data class provider responsible for providing a set of range data types, necessary for calculating formulas.
 * Those methods strongly using hot.getData and hot.getSourceData methods with some changes. Data provider additionally
 * collects all changes added to the data source to make them available faster than by using
 * hot.getData and hot.getSourceData methods.
 *
 * @class DataProvider
 * @util
 */
class DataProvider {
  constructor(hot) {
    /**
     * Handsontable instance.
     *
     * @type {Core}
     */
    this.hot = hot;
    /**
     * Collected changes applied into editors or by calling public Handsontable API. This is require to provide
     * fresh data applied into spreadsheet before they will be available from the public API.
     *
     * @type {Object}
     */
    this.changes = {};

	this.deps = {};
    /**
     * Record translator for translating visual records into psychical and vice versa.
     *
     * @type {RecordTranslator}
     */
    this.t = getTranslator(this.hot);
  }

  /**
   * Collect all data changes applied to the Handsontable to make them available later.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical column index.
   * @param {*} value Value to store.
   */
  collectChanges(row, column, value) {
    this.changes[this._coordId(row, column)] = value;
  }

  /**
   * Collect all deps changes applied to the Handsontable to make them available later.
   *
   * @param {Number} row Physical row index.
   * @param {Number} column Physical column index.
   * @param {*} value Value to store.
   */
  collectDeps(row, column, value) {
    this.deps[this._coordId(row, column)] = value;
  }

  /**
   * Clear all collected changes.
   */
  clearChanges() {
    this.changes = {};
	this.deps ={};
  }

  currentDatetime() {
        // 获取当前日期
        var date = new Date();

        // 获取当前月份
        var nowMonth = date.getMonth() + 1;

        // 获取当前是几号
        var strDate = date.getDate();

        // 添加分隔符“-”
        var seperator = "-";

        // 对月份进行处理，1-9月在前面添加一个“0”
        if (nowMonth >= 1 && nowMonth <= 9) {
            nowMonth = "0" + nowMonth;
        }

        // 对月份进行处理，1-9号在前面添加一个“0”
        if (strDate >= 0 && strDate <= 9) {
            strDate = "0" + strDate;
        }

        // 最后拼接字符串，得到一个格式为(yyyy-MM-dd)的日期
        return date.getFullYear() + seperator + nowMonth + seperator + strDate
            + seperator + date.getHours() + seperator + date.getMinutes() + seperator + date.getSeconds()
            + seperator + date.getMilliseconds();
}

  /**
   * Check if provided coordinates match to the table range data.
   *
   * @param {Number} visualRow Visual row index.
   * @param {Number} visualColumn Visual row index.
   * @returns {Boolean}
   */
  isInDataRange(visualRow, visualColumn) {
    return visualRow >= 0 && visualRow < this.hot.countRows() && visualColumn >= 0 && visualColumn < this.hot.countCols();
  }

  /**
   * Get calculated data at specified cell.
   *
   * @param {Number} visualRow Visual row index.
   * @param {Number} visualColumn Visual column index.
   * @returns {*}
   */
  getDataAtCell(visualRow, visualColumn) {
    const id = this._coordId(...this.t.toPhysical(visualRow, visualColumn));
    let result;

    if (hasOwnProperty(this.changes, id)) {
      result = this.changes[id];
    } else {
      result = this.hot.getDataAtCell(visualRow, visualColumn);
    }

    return result;
  }

  /**
   * Get calculated data at specified range.
   *
   * @param {Number} [visualRow1] Visual row index.
   * @param {Number} [visualColumn1] Visual column index.
   * @param {Number} [visualRow2] Visual row index.
   * @param {Number} [visualColumn2] Visual column index.
   * @returns {Array}
   */
  getDataByRange(visualRow1, visualColumn1, visualRow2, visualColumn2) {
    const result = this.hot.getData(visualRow1, visualColumn1, visualRow2, visualColumn2);

    arrayEach(result, (rowData, rowIndex) => {
      arrayEach(rowData, (value, columnIndex) => {
        const id = this._coordId(...this.t.toPhysical(rowIndex + visualRow1, columnIndex + visualColumn1));

        if (hasOwnProperty(this.changes, id)) {
          result[rowIndex][columnIndex] = this.changes[id];
        }
      });
    });

    return result;
  }

  /**
   * Get source data at specified physical cell.
   *
   * @param {Number} physicalRow Physical row index.
   * @param {Number} physicalColumn Physical column index.
   * @returns {*}
   */
  getSourceDataAtCell(physicalRow, physicalColumn) {
    const id = this._coordId(physicalRow, physicalColumn);
    let result;

    if (hasOwnProperty(this.changes, id)) {
      result = this.changes[id];
    } else {
      result = this.hot.getSourceDataAtCell(physicalRow, physicalColumn);
    }

    return result;
  }

  /**
   * Get source data at specified physical cell.
   *
   * @param {Number} physicalRow Physical row index.
   * @param {Number} physicalColumn Physical column index.
   * @returns {*}
   */
  getCellMetaAtCell(physicalRow, physicalColumn) {
    let result;
    result = this.hot.getCellMetaAtCell(physicalRow, physicalColumn);
    return result;
  }

  /**
   * Get source data at specified physical range.
   *
   * @param {Number} [physicalRow1] Physical row index.
   * @param {Number} [physicalColumn1] Physical column index.
   * @param {Number} [physicalRow2] Physical row index.
   * @param {Number} [physicalColumn2] Physical column index.
   * @returns {Array}
   */
  getSourceDataByRange(physicalRow1, physicalColumn1, physicalRow2, physicalColumn2) {
    return this.hot.getSourceDataArray(physicalRow1, physicalColumn1, physicalRow2, physicalColumn2);
  }

  /**
   * Get source data at specified visual cell.
   *
   * @param {Number} visualRow Visual row index.
   * @param {Number} visualColumn Visual column index.
   * @returns {*}
   */
  getRawDataAtCell(visualRow, visualColumn) {
    return this.getSourceDataAtCell(...this.t.toPhysical(visualRow, visualColumn));
  }

/**
   * Get change data at specified visual range.
   *
   * @param {Number} [visualRow1] Visual row index.
   * @param {Number} [visualColumn1] Visual column index.
   * @param {Number} [visualRow2] Visual row index.
   * @param {Number} [visualColumn2] Visual column index.
   * @returns {Array}
   */
  getChangeDataByRange(visualRow1, visualColumn1, visualRow2, visualColumn2) {
    const data = [];

    rangeEach(visualRow1, visualRow2, (visualRow) => {
      const row = [];

      rangeEach(visualColumn1, visualColumn2, (visualColumn) => {
        const [physicalRow, physicalColumn] = this.t.toPhysical(visualRow, visualColumn);
        const id = this._coordId(physicalRow, physicalColumn);
		
        if (hasOwnProperty(this.changes, id)) {
          row.push(this.changes[id]);
        } else if (hasOwnProperty(this.deps, id)) {
			//let data=this.getSourceDataAtCell(physicalRow, physicalColumn);
			//console.log(data);
          row.push(this.getSourceDataAtCell(physicalRow, physicalColumn));
        } else {
          row.push(this.getDataAtCell(physicalRow, physicalColumn));
        }
		
      });

      data.push(row);
    });

    return data;
  }

  /**
   * Get source data at specified visual range.
   *
   * @param {Number} [visualRow1] Visual row index.
   * @param {Number} [visualColumn1] Visual column index.
   * @param {Number} [visualRow2] Visual row index.
   * @param {Number} [visualColumn2] Visual column index.
   * @returns {Array}
   */
  getRawDataByRange(visualRow1, visualColumn1, visualRow2, visualColumn2) {
    const data = [];

    rangeEach(visualRow1, visualRow2, (visualRow) => {
      const row = [];

      rangeEach(visualColumn1, visualColumn2, (visualColumn) => {
        const [physicalRow, physicalColumn] = this.t.toPhysical(visualRow, visualColumn);
        const id = this._coordId(physicalRow, physicalColumn);

        if (hasOwnProperty(this.changes, id)) {
          row.push(this.changes[id]);
        } else {
          row.push(this.getSourceDataAtCell(physicalRow, physicalColumn));
        }
      });

      data.push(row);
    });

    return data;
  }

  /**
   * Update source data.
   *
   * @param {Number} physicalRow Physical row index.
   * @param {Number} physicalColumn Physical row index.
   * @param {*} value Value to update.
   */
  updateSourceData(physicalRow, physicalColumn, value) {
    this.hot.getSourceData()[physicalRow][this.hot.colToProp(physicalColumn)] = value;
  }

  /**
   * Generate cell coordinates id where the data changes will be stored.
   *
   * @param {Number} row Row index.
   * @param {Number} column Column index.
   * @returns {String}
   * @private
   */
  _coordId(row, column) {
    return `${row}:${column}`;
  }

  /**
   * Destroy class.
   */
  destroy() {
    this.hot = null;
    this.changes = null;
    this.t = null;
  }
}

export default DataProvider;
