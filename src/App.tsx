import React, { useState, useEffect, useRef } from 'react';
import moment, { Moment } from 'moment';
import classNames from 'classnames';
import { LeftOutline, RightOutline } from 'antd-mobile-icons';
import './App.css';

const weekList = ['日', '一' , '二', '三', '四', '五' , '六'];

export default function Calendar(props: {
  checkedDateChange?: (dateString: string, date: Moment) => void,
}) {
  const { checkedDateChange } = props;
  const [checkedDate, setCheckedDate] = useState(moment());
  const [currentDate, setCurrentDate] = useState(moment());
  const [lastDate, setLastDate] = useState(moment().subtract(1, 'M'));
  const [nextDate, setNextDate] = useState(moment().add(1, 'M'));
  const [showDateArr, setShowDateArr] = useState([[moment()]]);

  const [sessionHeight, setSessionHeight] = useState(0);
  const [translateIndex, setTranslateIndex] = useState(0);
  const [touchPostion, setTouchPostion] = useState({x: 0, y: 0});

  const dateItemRef: any = useRef();

  useEffect(() => {
    if (dateItemRef.current) {
      const dateItemHeight = dateItemRef.current?.offsetHeight || 0;
      setSessionHeight(dateItemHeight * 6);
    }
  }, [dateItemRef]);

  useEffect(() => {
    monthOrWeekOfThree();
  }, []);

  // 月/周数据处理-1
  const monthOrWeekOfOne = (date: Moment) => {
    // 日期是周几
    let dayOfWeek = moment(date).date(1).isoWeekday();
    // 日历表开始的日期
    let startDate = moment(date).date(1).subtract(dayOfWeek, 'd');
    // 日历表天数
    let calendarTotalDays = 42;
    const dateArr = [];

    while(dateArr.length < calendarTotalDays) {
      const day = moment(startDate);
      dateArr.push(day);
      startDate = startDate.add(1, 'd');
    }

    return dateArr;
  }

  // 月/周数据处理-3
  const monthOrWeekOfThree = (date: Moment = currentDate) => {
    const lastMonth = moment(date).subtract(1, 'M');
    const nextMonth = moment(date).add(1, 'M');

    const firstDateData = monthOrWeekOfOne(lastMonth);
    const currentDateData = monthOrWeekOfOne(date);
    const nextDateData = monthOrWeekOfOne(nextMonth);

    setShowDateArr([firstDateData, currentDateData, nextDateData]);
    setLastDate(lastMonth);
    setCurrentDate(date);
    setNextDate(nextMonth);
  }

  const onGetLastDate = () => {
    setTranslateIndex(translateIndex + 1);
    monthOrWeekOfThree(lastDate);
  }

  const onGetNextDate = () => {
    setTranslateIndex(translateIndex - 1);
    monthOrWeekOfThree(nextDate);
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
    // else if (Math.abs(moveY) > Math.abs(moveX) && Math.abs(moveY) > 50) {
    //   console.log('上下滑动');
      
    // }
  }

  const onChangeCheckedDate = (date: Moment) => {
    setCheckedDate(date);
    checkedDateChange?.(moment(date).format('YYYY-MM-DD HH:mm:ss'), date);
    if (moment(date).isSame(moment(lastDate), 'M')) {
      onGetLastDate();
    }
    if (moment(date).isSame(moment(nextDate), 'M')) {
      onGetNextDate();
    }
  }

  return (
    <div className='calendar-wrap'>
      <div className="calendar-title">
        <div onClick={onGetLastDate}>
          <LeftOutline />
        </div>
        <div className="calendar-title-date">
          {moment(currentDate).format('YYYY年MM月')}
        </div>
        <div onClick={onGetNextDate}>
          <RightOutline />
        </div>
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
          {showDateArr.map((monthItem: Moment[], monthIndex: number) => (
            <div
              key={`content-${monthIndex}`}
              className="calendar-content"
              style={{
                transform: `translate(${(monthIndex - 1 + translateIndex) * 100}%, 0)`,
                transitionDuration: '0.3s'
              }}
            >
              {monthItem.map((dateItem: Moment, dateIndex: number) => {
                const isToday = moment(dateItem).isSame(moment(), 'd');
                const isChecked = moment(checkedDate).isSame(moment(dateItem), 'd');
                const isDateInMonth = moment(dateItem).isSame(moment(currentDate), 'M');
                const isFirstDay = moment(dateItem).isSame(moment(dateItem).date(1), 'd');
                const dateTopClass = classNames('calendar-date-top', {
                  'calendar-date-today': isToday,
                  'calendar-date-checked': isChecked,
                  'calendar-date-notInMonth': !isDateInMonth,
                  'calendar-date-firstDay': isFirstDay && isDateInMonth,
                });
                let dateText: number | string = moment(dateItem).date();
                if (isToday) {
                  dateText = '今'
                }
                if (isFirstDay) {
                  dateText = `${moment(dateItem).month() + 1}月`;
                }
                return (
                  <div
                    key={`date-${dateIndex}`}
                    className='calendar-date'
                    ref={el => dateItemRef.current = el}
                  >
                    <div
                      className={dateTopClass}
                      onClick={() => {onChangeCheckedDate(dateItem)}}>
                        {dateText}
                      </div>
                    <div className='calendar-date-bot'></div>
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