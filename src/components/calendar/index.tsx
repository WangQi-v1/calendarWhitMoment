import React, { useState, useEffect, useRef } from 'react';
import moment, { Moment } from 'moment';
import classNames from 'classnames';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import { calendar } from '../../utils';
import './index.css';

interface IShowDate {
  date: Moment,
  lunarText: string,
  hasThingDot: boolean,
}

const weekList = ['日', '一' , '二', '三', '四', '五' , '六'];

export default function Calendar(props: any) {
  const {
    tagList,
    getCurrentDate, 
    checkedDateChange,
  } = props;
  const [checkedDate, setCheckedDate] = useState<Moment>(moment()); //  选中的日期
  const [currentDate, setCurrentDate] = useState<Moment>(moment()); // 当前日期
  const [lastDate, setLastDate] = useState<Moment>(moment().subtract(1, 'M')); // 上个月日期
  const [nextDate, setNextDate] = useState<Moment>(moment().add(1, 'M')); // 下个月日期
  const [showDateArr, setShowDateArr] = useState<IShowDate[][]>([[{date: moment(), lunarText: '', hasThingDot: false}]]); // 展示的日历数据
  const [sessionHeight, setSessionHeight] = useState<number>(0); // 日历表高度
  const [translateIndex, setTranslateIndex] = useState<number>(0); // 动画位移量
  const [touchPostion, setTouchPostion] = useState<{[key: string]: number}>({x: 0, y: 0}); // 手指滑动坐标

  const sectionContentRef: any = useRef();

  useEffect(() => {
    if (sectionContentRef.current && showDateArr.length === 3) {
      const dateItemHeight = sectionContentRef.current?.offsetHeight || 0;
      setSessionHeight(dateItemHeight);
    }
  }, [sectionContentRef, showDateArr]);

  useEffect(() => {
    monthOrWeekOfThree();
  }, []);

  useEffect(() => {
    getCurrentDate?.(currentDate);
  }, [currentDate]);

  useEffect(() => {
    checkedDateChange?.({ date: checkedDate });
  }, [checkedDate]);

  // 月/周数据处理-1
  const monthOrWeekOfOne = (date: Moment) => {
    // 日期是周几
    let dayOfWeek = moment(date).date(1).isoWeekday();
    // 日历表开始的日期
    let startDate = moment(date).date(1).subtract(dayOfWeek, 'd');
    const dateArr: any[] = [];

    for (let i = 0; i < 6; i++) {
      const lineDateArr = [];
      for (let j = 0; j < 7; j++) {
        const day = moment(startDate);
        lineDateArr.push(day);
        startDate = startDate.add(1, 'd');
      }
      // 判断当前行日期是否和当前月一致
      const is = lineDateArr.some(m => moment(date).isSame(moment(m), 'M'));
      // 当前行日期只要有1天和当前月一致，都要展示
      if (is) {
        lineDateArr.forEach(d => {
          const y = moment(d).year();
          const m = moment(d).month() + 1;
          const dd = moment(d).date();
          const lunarInfo: any = calendar.solar2lunar(y, m, dd);
          const lunarText: string = lunarPriority(lunarInfo !== -1 ? lunarInfo : {});
          const hasThingDot = isShowThingDot(d);
          dateArr.push({date: d, lunarText, hasThingDot});
        })
      }
    }
    return dateArr;
  }

  // 月/周数据处理-3
  const monthOrWeekOfThree = (date: Moment = currentDate, type?: string) => {
    const lastMonth = moment(date).subtract(1, 'M');
    const nextMonth = moment(date).add(1, 'M');

    let lastDateData = []; 
    let currentDateData = []; 
    let nextDateData = []; 
    if (type === 'last') {
      lastDateData = monthOrWeekOfOne(lastMonth);
      currentDateData = showDateArr[0];
      nextDateData = showDateArr[1];
    } else if (type === 'next') {
      lastDateData = showDateArr[1];
      currentDateData = showDateArr[2];
      nextDateData = monthOrWeekOfOne(nextMonth);
    } else {
      lastDateData = monthOrWeekOfOne(lastMonth);
      currentDateData = monthOrWeekOfOne(date);
      nextDateData = monthOrWeekOfOne(nextMonth);
    }

    setShowDateArr([lastDateData, currentDateData, nextDateData]);
    setLastDate(lastMonth);
    setCurrentDate(date);
    setNextDate(nextMonth);
  }

  // 切换上月日历
  const onGetLastDate = () => {
    setTranslateIndex(translateIndex + 1);
    monthOrWeekOfThree(lastDate, 'last');
  }

  // 切换下月日历
  const onGetNextDate = () => {
    setTranslateIndex(translateIndex - 1);
    monthOrWeekOfThree(nextDate, 'next');
  }

  const touchStart = (e: any) => {
    const startX = e.touches[0].clientX;
    const startY = e.touches[0].clientY;
    setTouchPostion({x: startX, y: startY});
  }

  const touchEnd = (e: any) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const moveX = endX - touchPostion.x;
    const moveY = endY - touchPostion.y;

    if (Math.abs(moveX) > Math.abs(moveY) && Math.abs(moveX) > 50) {
      if (moveX > 0) {
        onGetLastDate();
      } else {
        onGetNextDate();
      }
    }
  }

  const onChangeCheckedDate = (date: Moment) => {
    setCheckedDate(date);
    // 选中日期在上个月，切换到上个月
    if (moment(date).isSame(moment(lastDate), 'M')) {
      onGetLastDate();
    }
    // 选择日期在下个月，切换到下个月
    if (moment(date).isSame(moment(nextDate), 'M')) {
      onGetNextDate();
    }
  }

  // 展示日期圆点标记
  const isShowThingDot = (currentDay: Moment) => {
    const index = (tagList || []).findIndex((tag: string) => moment(tag).isSame(moment(currentDay), 'd'));
    return index > -1;
  }
  
  // 农历展示文案
  const lunarPriority = (lunarInfo: any) => {
    const { IMonthCn, IDayCn, lDay, Term, lunarFestival, festival } = lunarInfo || {};
    if (lunarFestival) return lunarFestival;
    if (Term) return Term;
    if (festival) return festival;
    if (lDay === 1) return IMonthCn;
    return IDayCn;
  };

  return (
    <div className='calendar-wrap'>
      <div className="calendar-title">
        <div onClick={onGetLastDate}><LeftOutline /></div>
        <div className="calendar-title-date">{moment(currentDate).format('YYYY年MM月')}</div>
        <div onClick={onGetNextDate}><RightOutline /></div>
      </div>
      <div className="calendar-week">
        {weekList.map((item: any) => (
          <div key={item} className="calendar-week-item">{item}</div>
        ))}
      </div>
      <div className="calendar-session" style={{height: `${sessionHeight}px`}}>
        <div
          style={{transform: `translate(${-(translateIndex * 100)}%, 0)`}}
          onTouchStart={touchStart}
          onTouchEnd={touchEnd}
        >
          {showDateArr.map((monthItem: IShowDate[], monthIndex: number) => (
            <div
              key={`content-${monthIndex}`}
              className="calendar-session-content"
              style={{
                transform: `translate(${(monthIndex - 1 + translateIndex) * 100}%, 0)`,
                transitionDuration: '0.3s'
              }}
              ref={el => { if (monthIndex === 1) { sectionContentRef.current = el }}}
            >
              {monthItem.map((dateItem: IShowDate, dateIndex: number) => {
                const { date, lunarText, hasThingDot } = dateItem
                const isToday = moment(date).isSame(moment(), 'd');
                const isChecked = moment(checkedDate).isSame(moment(date), 'd');
                const isDateInMonth = moment(date).isSame(moment(currentDate), 'M');
                const isFirstDay = moment(date).isSame(moment(date).date(1), 'd');
                const dateTopClass = classNames('calendar-session-dateTop', {
                  'calendar-session-dateToday': isToday,
                  'calendar-session-dateChecked': isChecked,
                  'calendar-session-dateNotInMonth': !isDateInMonth,
                  'calendar-session-dateFirstDay': isFirstDay && isDateInMonth,
                });
                const dateBotClass = classNames('calendar-session-dateBot', {
                  'calendar-session-dateBot-bgColor': hasThingDot,
                });
                return (
                  <div key={`date-${dateIndex}`} className='calendar-session-dateWrap'>
                    <div className='calendar-session-dateBox'>
                      <div className={dateTopClass} onClick={() => {onChangeCheckedDate(date)}}>
                          <span className='calendar-session-solar'>{moment(date).date()}</span>
                          <span className='calendar-session-lunar'>{lunarText}</span>
                      </div>
                      <div className={dateBotClass}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}